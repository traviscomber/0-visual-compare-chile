import { NextResponse } from "next/server"
import { searchCrossrefWorks, type CrossrefWorkSignal } from "@/lib/intelligence/crossref"
import { searchOpenAlexWorks, type OpenAlexWorkSignal } from "@/lib/intelligence/openalex"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const JUAN_EMAIL = "juan@n3uralia.com"
const REVIEW_THRESHOLD = 84
const FRONTIER_LIMIT = 5
const FRONTIER_DELTA_CAP = 10

const RESEARCH_QUERIES: Record<string, string> = {
  motil: "agentic AI mining maintenance workflow human approval tool use MCP predictive maintenance",
  pescamar: "multimodal AI seafood quality inspection aquaculture traceability production agent workflow",
  kumplio: "agentic AI regulatory compliance evidence workflow human oversight policy as code enterprise",
  chileflota: "fleet management agentic AI predictive maintenance telematics compliance workflow scheduling",
  "property-partners": "agentic AI real estate valuation comparables market intelligence workflow property",
  "black-swan": "agentic AI agriculture farm operations sensors maintenance digital twin workflow edge",
}

type FrontierPaper = {
  source: "OpenAlex" | "Crossref"
  sourceRecordId: string
  title: string
  date: string | null
  url: string
  doi: string | null
  citedByCount: number
  authors: string[]
  institutions: string[]
  publisher: string | null
  ageDays: number | null
  recencyScore: number
  citationScore: number
  rankScore: number
  earlySignal: boolean
}

type RecommendationRow = {
  id: string
  product_key: string
  title: string
  score: number
  status: "researching" | "ready_for_review" | "accepted" | "rejected"
  evidence_snapshot: Record<string, unknown> | null
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) return NextResponse.json({ ok: false, error: "Could not resolve target user." }, { status: 500 })

  const juan = users.users.find(user => user.email?.trim().toLowerCase() === JUAN_EMAIL)
  if (!juan) return NextResponse.json({ ok: false, error: "Target user not found." }, { status: 404 })

  const organizations = await listPortfolioOrganizations(admin, juan.id).catch(() => [])
  const organization = organizations[0] ?? null
  if (!organization) return NextResponse.json({ ok: false, error: "Target organization not found." }, { status: 404 })

  const { data, error } = await admin
    .from("intelligence_product_evolution_recommendations")
    .select("id,product_key,title,score,status,evidence_snapshot")
    .eq("user_id", juan.id)
    .eq("organization_id", organization.id)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const rows = (data ?? []) as RecommendationRow[]
  const from = new Date(Date.now() - 720 * 86_400_000)
  const to = new Date()
  const results: Array<Record<string, unknown>> = []

  for (const row of rows) {
    const query = RESEARCH_QUERIES[row.product_key]
    if (!query) continue

    const frontier = await buildResearchFrontier(query, from, to)
    const snapshot = { ...(row.evidence_snapshot ?? {}) } as Record<string, any>
    const conviction = { ...(snapshot.conviction ?? {}) }
    const previousPaperDelta = numberOrZero(conviction.paper_delta)
    const patentDelta = numberOrZero(conviction.patent_delta)
    const globalDelta = numberOrZero(conviction.global_delta)
    const chileDelta = numberOrZero(conviction.chile_delta)
    const base = typeof conviction.base === "number"
      ? conviction.base
      : clamp(Math.round(Number(row.score) - previousPaperDelta - patentDelta - globalDelta - chileDelta), 0, 100)

    const frontierDelta = scoreFrontierDelta(frontier)
    const effective = clamp(Math.round(base + frontierDelta + patentDelta + globalDelta + chileDelta), 0, 100)
    const lockedDecision = row.status === "accepted" || row.status === "rejected"
    const nextStatus = lockedDecision ? row.status : effective >= REVIEW_THRESHOLD ? "ready_for_review" : "researching"
    const sources = [...new Set(frontier.map(item => item.source))]
    const institutions = unique(frontier.flatMap(item => item.institutions)).slice(0, 12)
    const earlySignals = frontier.filter(item => item.earlySignal).length

    snapshot.paper = frontier[0] ? {
      source: frontier[0].source,
      title: frontier[0].title,
      date: frontier[0].date,
      url: frontier[0].url,
      citedByCount: frontier[0].citedByCount,
    } : null
    snapshot.world_frontier = {
      generated_at: new Date().toISOString(),
      query,
      window_days: 720,
      delta: frontierDelta,
      state: frontierState(frontier, sources.length, institutions.length),
      paper_count: frontier.length,
      early_signal_count: earlySignals,
      source_count: sources.length,
      independent_institution_count: institutions.length,
      sources,
      institutions,
      papers: frontier,
      note: "Recent, relevant papers can rank as early signals before citation counts mature. Frontier evidence changes world conviction only; institutional capability remains separate.",
    }
    snapshot.score_model = "evidence_conviction_v3: base + world research frontier + patent + global signal + Chile evidence; institution/integration excluded"
    snapshot.conviction = {
      ...conviction,
      base,
      paper_delta: frontierDelta,
      frontier_delta: frontierDelta,
      patent_delta: patentDelta,
      global_delta: globalDelta,
      chile_delta: chileDelta,
      effective,
    }

    const { error: updateError } = await admin
      .from("intelligence_product_evolution_recommendations")
      .update({
        score: effective,
        status: nextStatus,
        evidence_snapshot: snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)

    if (updateError) {
      console.error(`[cron/juan-research-frontier:${row.product_key}]`, updateError)
      results.push({ productKey: row.product_key, ok: false, error: updateError.message })
      continue
    }

    results.push({
      productKey: row.product_key,
      ok: true,
      frontierDelta,
      effective,
      status: nextStatus,
      papers: frontier.length,
      earlySignals,
      sources: sources.length,
      institutions: institutions.length,
      humanDecisionPreserved: lockedDecision,
    })
  }

  return NextResponse.json({
    ok: true,
    scoreModel: "evidence_conviction_v3",
    frontierLimit: FRONTIER_LIMIT,
    recommendations: results,
    durationMs: Date.now() - startedAt,
  })
}

async function buildResearchFrontier(query: string, from: Date, to: Date): Promise<FrontierPaper[]> {
  const [openAlexResult, crossrefResult] = await Promise.allSettled([
    searchOpenAlexWorks(query, from, to, 12),
    searchCrossrefWorks(query, from, to, 12),
  ])

  const openAlex = openAlexResult.status === "fulfilled" ? openAlexResult.value : []
  const crossref = crossrefResult.status === "fulfilled" ? crossrefResult.value : []
  if (openAlexResult.status === "rejected") console.warn("[juan-research-frontier:openalex]", openAlexResult.reason)
  if (crossrefResult.status === "rejected") console.warn("[juan-research-frontier:crossref]", crossrefResult.reason)

  const merged = [
    ...openAlex.map(normalizeOpenAlex),
    ...crossref.map(normalizeCrossref),
  ]

  const deduped = new Map<string, FrontierPaper>()
  for (const paper of merged) {
    const key = normalizeKey(paper.doi || paper.title)
    const existing = deduped.get(key)
    if (!existing || paper.rankScore > existing.rankScore) deduped.set(key, paper)
  }

  return [...deduped.values()]
    .sort((a, b) => b.rankScore - a.rankScore || (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, FRONTIER_LIMIT)
}

function normalizeOpenAlex(item: OpenAlexWorkSignal): FrontierPaper {
  return rankPaper({
    source: "OpenAlex",
    sourceRecordId: item.sourceRecordId,
    title: item.title,
    date: item.date,
    url: item.url,
    doi: item.doi,
    citedByCount: item.citedByCount,
    authors: item.authors,
    institutions: item.institutions,
    publisher: null,
  })
}

function normalizeCrossref(item: CrossrefWorkSignal): FrontierPaper {
  return rankPaper({
    source: "Crossref",
    sourceRecordId: item.sourceRecordId,
    title: item.title,
    date: item.date,
    url: item.url,
    doi: item.doi,
    citedByCount: item.citedByCount,
    authors: item.authors,
    institutions: [],
    publisher: item.publisher,
  })
}

function rankPaper(input: Omit<FrontierPaper, "ageDays" | "recencyScore" | "citationScore" | "rankScore" | "earlySignal">): FrontierPaper {
  const ageDays = input.date ? Math.max(0, Math.round((Date.now() - Date.parse(`${input.date}T12:00:00Z`)) / 86_400_000)) : null
  const recencyScore = ageDays === null ? 1 : ageDays <= 90 ? 6 : ageDays <= 180 ? 5 : ageDays <= 365 ? 3 : 1
  const citationScore = Math.min(5, Math.round(Math.log10(Math.max(1, input.citedByCount + 1)) * 2))
  const earlySignal = ageDays !== null && ageDays <= 180
  const rankScore = recencyScore * 2 + citationScore + (earlySignal ? 2 : 0)
  return { ...input, ageDays, recencyScore, citationScore, rankScore, earlySignal }
}

function scoreFrontierDelta(frontier: FrontierPaper[]) {
  if (!frontier.length) return 0
  const sources = new Set(frontier.map(item => item.source)).size
  const institutions = unique(frontier.flatMap(item => item.institutions)).length
  const earlySignals = frontier.filter(item => item.earlySignal).length
  const recent = frontier.filter(item => item.ageDays !== null && item.ageDays <= 365).length
  const breadth = Math.min(3, Math.max(0, frontier.length - 1))
  const sourceConvergence = sources >= 2 ? 1 : 0
  const institutionConvergence = institutions >= 3 ? 2 : institutions >= 2 ? 1 : 0
  const earlyMomentum = earlySignals >= 2 ? 2 : earlySignals === 1 ? 1 : 0
  const recency = recent >= 3 ? 2 : recent >= 1 ? 1 : 0
  return clamp(2 + breadth + sourceConvergence + institutionConvergence + earlyMomentum + recency, 0, FRONTIER_DELTA_CAP)
}

function frontierState(frontier: FrontierPaper[], sourceCount: number, institutionCount: number) {
  if (!frontier.length) return "not_observed"
  const early = frontier.filter(item => item.earlySignal).length
  if (early >= 2 && (sourceCount >= 2 || institutionCount >= 2)) return "early_convergence"
  if (sourceCount >= 2 || institutionCount >= 3) return "converging"
  if (frontier.length >= 3) return "emerging"
  return "single_signal"
}

function normalizeKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function unique(values: string[]) {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
