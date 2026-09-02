import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"
import { normalizeTechnologyQuery } from "@/lib/intelligence/technology-query"
import { buildStrategicSearchIntent, type StrategicSearchIntent } from "@/lib/intelligence/search-intent"

const OPENALEX_BASE = "https://api.openalex.org"
const TIMEOUT_MS = 9000
const OPENALEX_REVALIDATE_SECONDS = 6 * 60 * 60

export type OpenAlexWorkSignal = {
  source: "openalex"
  sourceRecordId: string
  title: string
  date: string | null
  url: string
  doi: string | null
  citedByCount: number
  authors: string[]
  institutions: string[]
  topic: string | null
}

export type OpenAlexWindowSignal = {
  count: number
  works: OpenAlexWorkSignal[]
}

type OpenAlexResponse = {
  meta?: { count?: number }
  results?: Array<Record<string, unknown>>
}

type NextFetchInit = RequestInit & {
  next?: { revalidate: number }
}

const inFlightOpenAlex = new Map<string, Promise<OpenAlexResponse>>()

export async function queryOpenAlexWindow(query: string, from: Date, to: Date, limit = 8): Promise<OpenAlexWindowSignal> {
  const payload = await requestOpenAlexWorks({
    // VIDENTIA keeps the executive momentum KPI title-led. Broader title/abstract
    // retrieval is a separate discovery layer and can never inflate this count.
    filter: technologyFilter(query, from, to),
    per_page: String(Math.min(Math.max(limit, 1), 20)),
    select: "id,title,publication_date,doi,cited_by_count,authorships,primary_topic",
  })

  return {
    count: Number(payload.meta?.count ?? 0),
    works: parseOpenAlexWorks(payload.results ?? []),
  }
}

export async function countOpenAlexWorks(query: string, from: Date, to: Date) {
  return (await queryOpenAlexWindow(query, from, to, 1)).count
}

export async function searchOpenAlexWorks(query: string, from: Date, to: Date, limit = 8): Promise<OpenAlexWorkSignal[]> {
  const intent = buildStrategicSearchIntent(query, "global")
  return await searchOpenAlexDiscovery(intent, from, to, limit)
}

export async function searchOpenAlexDiscovery(
  intent: StrategicSearchIntent,
  from: Date,
  to: Date,
  limit = 12,
): Promise<OpenAlexWorkSignal[]> {
  const oql = buildOpenAlexDiscoveryOql(intent, from, to)
  const payload = await requestOpenAlexOql(oql, Math.min(Math.max(limit * 2, 12), 30))
  return parseOpenAlexWorks(payload.results ?? [])
    .filter(item => inDateRange(item.date, from, to))
    .slice(0, Math.min(Math.max(limit, 1), 20))
}

export function buildOpenAlexDiscoveryOql(intent: StrategicSearchIntent, from: Date, to: Date) {
  const core = intent.concept.core.slice(0, 6).map(oqlSearchTerm).filter(Boolean)
  const context = intent.concept.context.slice(0, 6).map(oqlSearchTerm).filter(Boolean)
  const coreBlock = core.length ? `(${core.join(" or ")})` : oqlSearchTerm(intent.globalQueries[0] ?? intent.canonicalQuery)
  const semanticBlock = context.length
    ? `title/abstract has (${coreBlock} and (${context.join(" or ")}))`
    : `title/abstract has (${coreBlock})`
  const minYear = from.getUTCFullYear()
  const maxYear = to.getUTCFullYear()
  return `works where year >= (${minYear}) and year <= (${maxYear}) and ${semanticBlock}`
}

async function requestOpenAlexWorks(params: Record<string, string>): Promise<OpenAlexResponse> {
  const url = new URL(`${OPENALEX_BASE}/works`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return await requestOpenAlexUrl(url)
}

async function requestOpenAlexOql(oql: string, limit: number): Promise<OpenAlexResponse> {
  const url = new URL(`${OPENALEX_BASE}/`)
  url.searchParams.set("oql", oql)
  url.searchParams.set("per-page", String(limit))
  url.searchParams.set("select", "id,title,publication_date,doi,cited_by_count,authorships,primary_topic")
  return await requestOpenAlexUrl(url)
}

async function requestOpenAlexUrl(url: URL): Promise<OpenAlexResponse> {
  const apiKey = String(process.env.OPENALEX_API_KEY ?? "").trim()
  if (apiKey) url.searchParams.set("api_key", apiKey)

  const requestKey = url.toString()
  const pending = inFlightOpenAlex.get(requestKey)
  if (pending) return await pending

  const operation = performOpenAlexRequest(url)
  inFlightOpenAlex.set(requestKey, operation)
  try {
    return await operation
  } finally {
    if (inFlightOpenAlex.get(requestKey) === operation) inFlightOpenAlex.delete(requestKey)
  }
}

async function performOpenAlexRequest(url: URL): Promise<OpenAlexResponse> {
  const init: NextFetchInit = {
    cache: "force-cache",
    next: { revalidate: OPENALEX_REVALIDATE_SECONDS },
    headers: { Accept: "application/json", "User-Agent": "VIDENTIA/1.0" },
  }
  const response = await fetchWithRetry(url, init, {
    attempts: 3,
    baseDelayMs: 500,
    timeoutMs: TIMEOUT_MS,
  })

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining")
    const reset = response.headers.get("x-ratelimit-reset")
    const diagnostic = [remaining !== null ? `remaining=${remaining}` : null, reset ? `reset=${reset}` : null].filter(Boolean).join(" ")
    throw new Error(`OpenAlex respondió ${response.status}${diagnostic ? ` (${diagnostic})` : ""}`)
  }
  return await response.json() as OpenAlexResponse
}

function parseOpenAlexWorks(rows: Array<Record<string, unknown>>): OpenAlexWorkSignal[] {
  return rows.flatMap(row => {
    const id = asString(row.id)
    const title = asString(row.title)
    if (!id || !title) return []

    const authorships = Array.isArray(row.authorships) ? row.authorships as Array<Record<string, unknown>> : []
    const authors = unique(authorships.flatMap(item => {
      const author = isRecord(item.author) ? asString(item.author.display_name) : null
      return author ? [author] : []
    })).slice(0, 8)
    const institutions = unique(authorships.flatMap(item => {
      const rows = Array.isArray(item.institutions) ? item.institutions as Array<Record<string, unknown>> : []
      return rows.flatMap(institution => {
        const name = asString(institution.display_name)
        return name ? [name] : []
      })
    })).slice(0, 8)

    const primaryTopic = isRecord(row.primary_topic) ? asString(row.primary_topic.display_name) : null
    const doi = asString(row.doi)

    return [{
      source: "openalex" as const,
      sourceRecordId: id,
      title,
      date: asString(row.publication_date),
      url: doi || id,
      doi,
      citedByCount: Number(row.cited_by_count ?? 0),
      authors,
      institutions,
      topic: primaryTopic,
    }]
  })
}

function technologyFilter(query: string, from: Date, to: Date) {
  const safeQuery = normalizeTechnologyQuery(query)
  return `from_publication_date:${dateOnly(from)},to_publication_date:${dateOnly(to)},title.search:${safeQuery}`
}

function oqlSearchTerm(value: string) {
  const clean = value.replace(/[\\"]/g, " ").replace(/\s+/g, " ").trim()
  if (!clean) return ""
  if (/^[a-z0-9-]+$/i.test(clean)) return clean
  return `stemmed "${clean}"`
}

function inDateRange(value: string | null, from: Date, to: Date) {
  if (!value) return false
  const time = Date.parse(`${value}T12:00:00Z`)
  return Number.isFinite(time) && time >= from.getTime() && time <= to.getTime()
}

function dateOnly(value: Date) { return value.toISOString().slice(0, 10) }
function asString(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function unique(values: string[]) { return [...new Set(values)] }
