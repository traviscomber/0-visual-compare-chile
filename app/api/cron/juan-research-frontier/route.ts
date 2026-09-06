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

// Canonical evidence-only starting conviction. These are intentionally independent
// from N3uralia assets, integration leverage and execution capability.
const BASE_CONVICTION: Record<string, number> = {
  motil: 74,
  pescamar: 72,
  kumplio: 75,
  chileflota: 70,
  "property-partners": 69,
  "black-swan": 68,
}

const RESEARCH_ANCHORS: Record<string, string[]> = {
  motil: ["mining", "mine", "mineral", "geology", "geological"],
  pescamar: ["seafood", "aquaculture", "aquatic", "fish", "salmon", "marine"],
  kumplio: ["compliance", "regulatory", "regulation", "policy", "audit", "governance"],
  chileflota: ["fleet", "vehicle", "automotive", "telematics", "transportation"],
  "property-partners": ["real estate", "property", "valuation", "housing", "housing market"],
  "black-swan": ["agriculture", "agricultural", "farm", "crop", "orchard", "horticulture"],
}

const TECHNOLOGY_ANCHORS: Record<string, string[]> = {
  motil: ["agentic", "artificial intelligence", "machine learning", "predictive maintenance", "automation", "autonomous", "digital twin", "large language model", "llm", "mcp"],
  pescamar: ["agentic", "artificial intelligence", "machine learning", "computer vision", "multimodal", "automation", "autonomous", "digital twin", "predictive", "traceability"],
  kumplio: ["agentic", "artificial intelligence", "machine learning", "rag", "retrieval augmented", "automation", "autonomous", "workflow", "policy as code"],
  chileflota: ["agentic", "artificial intelligence", "machine learning", "predictive maintenance", "automation", "autonomous", "digital twin", "telematics"],
  "property-partners": ["agentic", "artificial intelligence", "machine learning", "automated valuation", "automation", "predictive", "large language model", "llm"],
  "black-swan": ["agentic", "artificial intelligence", "machine learning", "computer vision", "automation", "autonomous", "digital twin", "sensor", "iot", "edge"],
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
  anchorHits: string[]
  technologyHits: string[]
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

    const anchors = RESEARCH_ANCHORS[row.product_key] ?? []
    const technologyAnchors = TECHNOLOGY_ANCHORS[row.product_key] ?? []
    const frontier = await buildResearchFrontier(row.product_key, query, anchors, technologyAnchors, from, to)
    const snapshot = { ...(row.evidence_snapshot ?? {}) } as Record<string, any>
    const conviction = { ...(snapshot.conviction ?? {}) }

    // Never bootstrap from the legacy row score. Older scores mixed evidence with
    // institutional capability; v3.2 deliberately rebases to the evidence-only baseline.
    const base = BASE_CONVICTION[row.product_key] ?? clamp(numberOrZero(conviction.base), 0, 100)
    const patentDelta = typeof conviction.patent_delta === "number"
      ? conviction.patent_delta
      : snapshot.patent ? 5 : 0
    const chileDelta = typeof conviction.chile_delta === "number"
      ? conviction.chile_delta
      : numberOrZero(snapshot.chile_evidence?.delta)

    const frontierDelta = scoreFrontierDelta(frontier)
    const globalSignalText = normalizeKey(String(snapshot.global_signal?.title ?? ""))
    const globalSignalAnchorHits = anchors.filter(anchor => containsAnchor(globalSignalText, anchor))
    const globalSignalTechnologyHits = technologyAnchors.filter(anchor => containsAnchor(globalSignalText, anchor))
    const globalSignalQualified = globalSignalAnchorHits.length > 0 && globalSignalTechnologyHits.length > 0
    const globalDelta = globalSignalQualified
      ? snapshot.global_signal?.relevance === "alta" ? 5 : 3
      : 0

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
      anchors,
      technology_anchors: technologyAnchors,
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
      quality_gate: "A paper contributes only when it contains both explicit domain evidence and explicit technology/method evidence. Same-title publications are deduplicated.",
      note: "Recent domain-and-technology-qualified papers can rank as early signals before citation counts mature. Institutional capability remains separate from evidence conviction.",
    }
    snapshot.global_signal_quality = {
      scoring: globalDelta > 0,
      anchor_hits: globalSignalAnchorHits,
      technology_hits: globalSignalTechnologyHits,
      reason: globalDelta > 0
        ? "Global signal contains both domain and technology evidence and may contribute to world conviction."
        : "Global signal does not satisfy both domain and technology evidence gates; it remains context with zero conviction contribution.",
    }
    snapshot.score_model = "evidence_conviction_v3.2: canonical evidence-only base + domain-and-technology-qualified world frontier + patent + qualified global signal + Chile evidence; institution/integration excluded"
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
      base,
      frontierDelta,
      patentDelta,
      globalDelta,
      chileDelta,
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
    scoreModel: "evidence_conviction_v3.2",
    frontierLimit: FRONTIER_LIMIT,
    recommendations: results,
    durationMs: Date.now() - startedAt,
  })
}

async function buildResearchFrontier(productKey: string, query: string, anchors: string[], technologyAnchors: string[], from: Date, to: Date): Promise<FrontierPaper[]> {
  const [openAlexResult, crossrefResult] = await Promise.allSettled([
    searchOpenAlexWorks(query, from, to, 12),
    searchCrossrefWorks(query, from, to, 12),
  ])

  const openAlex = openAlexResult.status === "fulfilled" ? openAlexResult.value : []
  const crossref = crossrefResult.status === "fulfilled" ? crossrefResult.value : []
  if (openAlexResult.status === "rejected") console.warn(`[juan-research-frontier:${productKey}:openalex]`, openAlexResult.reason)
  if (crossrefResult.status === "rejected") console.warn(`[juan-research-frontier:${productKey}:crossref]`, crossrefResult.reason)

  const merged = [
    ...openAlex.map(item => normalizeOpenAlex(item, anchors, technologyAnchors)),
    ...crossref.map(item => normalizeCrossref(item, anchors, technologyAnchors)),
  ].filter(item => item.anchorHits.length > 0 && item.technologyHits.length > 0)

  const byTitle = new Map<string, FrontierPaper>()
  for (const paper of merged) {
    const key = normalizeKey(paper.title)
    const existing = byTitle.get(key)
    if (!existing || paper.rankScore > existing.rankScore) byTitle.set(key, paper)
  }

  return [...byTitle.values()]
    .sort((a, b) => b.rankScore - a.rankScore || (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, FRONTIER_LIMIT)
}

function normalizeOpenAlex(item: OpenAlexWorkSignal, anchors: string[], technologyAnchors: string[]): FrontierPaper {
  const evidenceText = [item.title, item.topic].filter(Boolean).join(" ")
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
    anchorHits: findAnchorHits(evidenceText, anchors),
    technologyHits: findAnchorHits(evidenceText, technologyAnchors),
  })
}

function normalizeCrossref(item: CrossrefWorkSignal, anchors: string[], technologyAnchors: string[]): FrontierPaper {
  const evidenceText = [item.title, ...item.subjects].join(" ")
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
    anchorHits: findAnchorHits(evidenceText, anchors),
    technologyHits: findAnchorHits(evidenceText, technologyAnchors),
  })
}

function rankPaper(input: Omit<FrontierPaper, "ageDays" | "recencyScore" | "citationScore" | "rankScore" | "earlySignal">): FrontierPaper {
  const ageDays = input.date ? Math.max(0, Math.round((Date.now() - Date.parse(`${input.date}T12:00:00Z`)) / 86_400_000)) : null
  const recencyScore = ageDays === null ? 1 : ageDays <= 90 ? 6 : ageDays <= 180 ? 5 : ageDays <= 365 ? 3 : 1
  const citationScore = Math.min(5, Math.round(Math.log10(Math.max(1, input.citedByCount + 1)) * 2))
  const earlySignal = ageDays !== null && ageDays <= 180
  const domainSpecificityScore = Math.min(3, input.anchorHits.length)
  const technologySpecificityScore = Math.min(3, input.technologyHits.length)
  const rankScore = recencyScore * 2 + citationScore + domainSpecificityScore + technologySpecificityScore + (earlySignal ? 2 : 0)
  return { ...input, ageDays, recencyScore, citationScore, rankScore, earlySignal }
}

function scoreFrontierDelta(frontier: FrontierPaper[]) {
  if (!frontier.length) return 0
  const sources = new Set(frontier.map(item => item.source)).size
  const institutions = unique(frontier.flatMap(item => item.institutions)).length
  const earlySignals = frontier.filter(item => item.earlySignal).length
  const highlySpecific = frontier.filter(item => item.anchorHits.length >= 2 && item.technologyHits.length >= 2).length
  const cited = frontier.filter(item => item.citedByCount > 0).length
  const breadth = frontier.length >= 4 ? 4 : frontier.length >= 2 ? 3 : 2
  const sourceConvergence = sources >= 2 ? 1 : 0
  const institutionConvergence = institutions >= 3 ? 2 : institutions >= 2 ? 1 : 0
  const earlyMomentum = earlySignals >= 2 ? 2 : earlySignals === 1 ? 1 : 0
  const specificity = highlySpecific >= 2 ? 1 : 0
  const validation = cited >= 2 ? 1 : 0
  return clamp(breadth + sourceConvergence + institutionConvergence + earlyMomentum + specificity + validation, 0, FRONTIER_DELTA_CAP)
}

function frontierState(frontier: FrontierPaper[], sourceCount: number, institutionCount: number) {
  if (!frontier.length) return "not_observed"
  const early = frontier.filter(item => item.earlySignal).length
  if (early >= 2 && (sourceCount >= 2 || institutionCount >= 2)) return "early_convergence"
  if (sourceCount >= 2 || institutionCount >= 3) return "converging"
  if (frontier.length >= 3) return "emerging"
  return "single_signal"
}

function findAnchorHits(value: string, anchors: string[]) {
  const normalized = normalizeKey(value)
  return anchors.filter(anchor => containsAnchor(normalized, anchor))
}

function containsAnchor(normalizedValue: string, anchor: string) {
  const normalizedAnchor = normalizeKey(anchor)
  return ` ${normalizedValue} `.includes(` ${normalizedAnchor} `)
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
