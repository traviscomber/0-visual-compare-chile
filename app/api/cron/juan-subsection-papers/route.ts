import { NextResponse } from "next/server"
import { searchCrossrefWorks, type CrossrefWorkSignal } from "@/lib/intelligence/crossref"
import { searchOpenAlexWorks, type OpenAlexWorkSignal } from "@/lib/intelligence/openalex"
import {
  deriveProductResearchTopics,
  productResearchDomain,
  SUBSECTION_TECHNOLOGY_ANCHORS,
  type ProductResearchTopic,
} from "@/lib/intelligence/product-subsection-research"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const JUAN_EMAIL = "juan@n3uralia.com"
const TOPIC_LIMIT = 3
const PAPERS_PER_TOPIC = 4
const WINDOW_DAYS = 720
const BOUNDARY = "Subsection papers are external discovery evidence selected from current product activity. GitHub only chooses what to investigate; it never contributes evidence conviction. These papers remain non-scoring until an independent evidence review promotes them into a canonical scoring layer."

type ProductRow = {
  id: string
  product_key: string
  product_name: string
  status: string
  score: number
  evidence_snapshot: Record<string, unknown> | null
}

type TopicPaper = {
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
  domainHits: string[]
  topicHits: string[]
  technologyHits: string[]
  rankScore: number
  earlySignal: boolean
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
    .select("id,product_key,product_name,status,score,evidence_snapshot")
    .eq("user_id", juan.id)
    .eq("organization_id", organization.id)
    .neq("status", "rejected")

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const rows = (data ?? []) as ProductRow[]
  const from = new Date(Date.now() - WINDOW_DAYS * 86_400_000)
  const to = new Date()
  const results: Array<Record<string, unknown>> = []

  for (const row of rows) {
    const domain = productResearchDomain(row.product_key)
    if (!domain) {
      results.push({ productKey: row.product_key, ok: false, skipped: true, reason: "unsupported_product_domain" })
      continue
    }

    const snapshot = { ...(row.evidence_snapshot ?? {}) } as Record<string, any>
    const topics = deriveProductResearchTopics(row.product_key, snapshot.repo_activity, TOPIC_LIMIT)
    const topicResults = await Promise.all(topics.map(topic => researchTopic(row.product_key, domain.query, domain.anchors, topic, from, to)))
    const allPapers = dedupePapers(topicResults.flatMap(item => item.papers))
    const sourceSet = new Set(allPapers.map(item => item.source))
    const institutions = unique(allPapers.flatMap(item => item.institutions)).slice(0, 20)
    const selectionSources = unique(topics.map(topic => topic.source))
    const generatedAt = new Date().toISOString()

    const subsectionResearch = {
      generated_at: generatedAt,
      window_days: WINDOW_DAYS,
      selection_context: selectionSources,
      github_observed_at: asString(snapshot.repo_activity?.observedAt),
      topics: topicResults,
      topic_count: topicResults.length,
      paper_count: allPapers.length,
      source_count: sourceSet.size,
      independent_institution_count: institutions.length,
      sources: [...sourceSet],
      institutions,
      conviction_delta: 0,
      decision_effect: "none",
      scoring_state: "discovery_only",
      quality_gate: "A subsection paper is retained only when the paper contains explicit product-domain evidence, explicit subsection evidence, and explicit AI/technology/method evidence. Source failure or absence is neutral.",
      boundary: BOUNDARY,
    }

    const nextSnapshot = {
      ...snapshot,
      subsection_research: subsectionResearch,
    }
    const { error: updateError } = await admin
      .from("intelligence_product_evolution_recommendations")
      .update({ evidence_snapshot: nextSnapshot })
      .eq("id", row.id)
      .eq("user_id", juan.id)
      .eq("organization_id", organization.id)

    if (updateError) {
      results.push({ productKey: row.product_key, ok: false, error: updateError.message })
      continue
    }

    results.push({
      productKey: row.product_key,
      productName: row.product_name,
      ok: true,
      topics: topicResults.map(item => ({ key: item.key, source: item.selectionSource, papers: item.paper_count })),
      papers: allPapers.length,
      sources: sourceSet.size,
      institutions: institutions.length,
      scoreBefore: row.score,
      scoreChanged: false,
      statusBefore: row.status,
      humanDecisionPreserved: row.status === "accepted" || row.status === "rejected",
      convictionDelta: 0,
    })
  }

  const response = {
    ok: results.some(item => item.ok === true),
    mode: "dynamic_subsection_papers_v1",
    boundary: BOUNDARY,
    products: results,
    durationMs: Date.now() - startedAt,
  }
  console.info("[cron/juan-subsection-papers]", JSON.stringify(response))
  return NextResponse.json(response)
}

async function researchTopic(
  productKey: string,
  domainQuery: string,
  domainAnchors: string[],
  topic: ProductResearchTopic,
  from: Date,
  to: Date,
) {
  const query = `${domainQuery} ${topic.searchPhrase} artificial intelligence automation decision support`
  const [openAlexResult, crossrefResult] = await Promise.allSettled([
    searchOpenAlexWorks(query, from, to, 8),
    searchCrossrefWorks(query, from, to, 8),
  ])
  const openAlex = openAlexResult.status === "fulfilled" ? openAlexResult.value : []
  const crossref = crossrefResult.status === "fulfilled" ? crossrefResult.value : []
  if (openAlexResult.status === "rejected") console.warn(`[juan-subsection-papers:${productKey}:${topic.key}:openalex]`, openAlexResult.reason)
  if (crossrefResult.status === "rejected") console.warn(`[juan-subsection-papers:${productKey}:${topic.key}:crossref]`, crossrefResult.reason)

  const papers = dedupePapers([
    ...openAlex.map(item => normalizeOpenAlex(item, domainAnchors, topic.anchors)),
    ...crossref.map(item => normalizeCrossref(item, domainAnchors, topic.anchors)),
  ].filter((item): item is TopicPaper => Boolean(item)))
    .sort((a, b) => b.rankScore - a.rankScore || (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, PAPERS_PER_TOPIC)

  return {
    key: topic.key,
    label: topic.label,
    query,
    selectionSource: topic.source,
    activityWeight: topic.activityWeight,
    anchors: topic.anchors,
    paper_count: papers.length,
    source_coverage: {
      OpenAlex: openAlexResult.status === "fulfilled" ? "available" : "unavailable",
      Crossref: crossrefResult.status === "fulfilled" ? "available" : "unavailable",
    },
    papers,
  }
}

function normalizeOpenAlex(item: OpenAlexWorkSignal, domainAnchors: string[], topicAnchors: string[]): TopicPaper | null {
  const text = [item.title, item.topic].filter(Boolean).join(" ")
  return normalizePaper({
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
  }, text, domainAnchors, topicAnchors)
}

function normalizeCrossref(item: CrossrefWorkSignal, domainAnchors: string[], topicAnchors: string[]): TopicPaper | null {
  const text = [item.title, ...item.subjects].join(" ")
  return normalizePaper({
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
  }, text, domainAnchors, topicAnchors)
}

function normalizePaper(
  base: Omit<TopicPaper, "domainHits" | "topicHits" | "technologyHits" | "rankScore" | "earlySignal">,
  evidenceText: string,
  domainAnchors: string[],
  topicAnchors: string[],
): TopicPaper | null {
  const domainHits = findHits(evidenceText, domainAnchors)
  const topicHits = findHits(evidenceText, topicAnchors)
  const technologyHits = findHits(evidenceText, SUBSECTION_TECHNOLOGY_ANCHORS)
  if (!domainHits.length || !topicHits.length || !technologyHits.length) return null

  const ageDays = base.date ? Math.max(0, Math.round((Date.now() - Date.parse(`${base.date}T12:00:00Z`)) / 86_400_000)) : null
  const earlySignal = ageDays !== null && ageDays <= 180
  const recency = ageDays === null ? 1 : ageDays <= 90 ? 6 : ageDays <= 180 ? 5 : ageDays <= 365 ? 3 : 1
  const citation = Math.min(5, Math.round(Math.log10(Math.max(1, base.citedByCount + 1)) * 2))
  const specificity = Math.min(3, domainHits.length) + Math.min(3, topicHits.length) + Math.min(3, technologyHits.length)
  const rankScore = recency * 2 + citation + specificity + (earlySignal ? 2 : 0)
  return { ...base, domainHits, topicHits, technologyHits, rankScore, earlySignal }
}

function findHits(text: string, anchors: string[]) {
  const normalized = normalize(text)
  return unique(anchors.filter(anchor => containsAnchor(normalized, anchor)))
}
function containsAnchor(normalizedText: string, anchor: string) {
  const normalizedAnchor = normalize(anchor)
  if (!normalizedAnchor) return false
  return ` ${normalizedText} `.includes(` ${normalizedAnchor} `)
}
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim() }
function dedupePapers(items: TopicPaper[]) {
  const seen = new Map<string, TopicPaper>()
  for (const item of items) {
    const key = normalize(item.doi ?? item.title)
    const existing = seen.get(key)
    if (!existing || item.rankScore > existing.rankScore) seen.set(key, item)
  }
  return [...seen.values()]
}
function asString(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null }
function unique(values: string[]) { return [...new Set(values)] }
