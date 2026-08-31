const OPENALEX_BASE = "https://api.openalex.org"
const TIMEOUT_MS = 9000

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

type OpenAlexResponse = {
  meta?: { count?: number }
  results?: Array<Record<string, unknown>>
}

export async function countOpenAlexWorks(query: string, from: Date, to: Date) {
  const payload = await requestOpenAlex({
    search: query,
    filter: `from_publication_date:${dateOnly(from)},to_publication_date:${dateOnly(to)}`,
    "per-page": "1",
  })
  return Number(payload.meta?.count ?? 0)
}

export async function searchOpenAlexWorks(query: string, from: Date, to: Date, limit = 8): Promise<OpenAlexWorkSignal[]> {
  const payload = await requestOpenAlex({
    search: query,
    filter: `from_publication_date:${dateOnly(from)},to_publication_date:${dateOnly(to)}`,
    // Preserve OpenAlex's default relevance ordering. Sorting by publication date can
    // promote recent works that only match weakly in abstracts/full text.
    "per-page": String(Math.min(Math.max(limit, 1), 20)),
  })

  return (payload.results ?? []).flatMap(row => {
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

async function requestOpenAlex(params: Record<string, string>): Promise<OpenAlexResponse> {
  const url = new URL(`${OPENALEX_BASE}/works`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  const apiKey = String(process.env.OPENALEX_API_KEY ?? "").trim()
  if (apiKey) url.searchParams.set("api_key", apiKey)

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "VIDENTIA/1.0" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`OpenAlex respondió ${response.status}`)
  return await response.json() as OpenAlexResponse
}

function dateOnly(value: Date) { return value.toISOString().slice(0, 10) }
function asString(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function unique(values: string[]) { return [...new Set(values)] }
