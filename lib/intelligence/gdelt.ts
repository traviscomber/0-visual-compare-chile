import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"
const TIMEOUT_MS = 15000

export type GdeltNewsSignal = {
  source: "gdelt"
  sourceRecordId: string
  title: string
  date: string | null
  url: string
  domain: string | null
  sourceCountry: string | null
  language: string | null
}

type GdeltResponse = { articles?: Array<Record<string, unknown>> }

export async function searchGdeltNews(query: string, from: Date, to: Date, limit = 10): Promise<GdeltNewsSignal[]> {
  const url = new URL(GDELT_DOC_API)
  url.searchParams.set("query", query)
  url.searchParams.set("mode", "ArtList")
  url.searchParams.set("maxrecords", String(Math.min(Math.max(limit, 1), 25)))
  url.searchParams.set("format", "json")
  url.searchParams.set("sort", "DateDesc")
  url.searchParams.set("startdatetime", gdeltDate(from))
  url.searchParams.set("enddatetime", gdeltDate(to))

  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "VIDENTIA/1.0" },
  }, {
    attempts: 3,
    baseDelayMs: 750,
    timeoutMs: TIMEOUT_MS,
  })
  if (!response.ok) throw new Error(`GDELT respondió ${response.status}`)

  const payload = await response.json() as GdeltResponse
  return (payload.articles ?? []).flatMap(row => {
    const articleUrl = asString(row.url)
    const title = asString(row.title)
    if (!articleUrl || !title) return []
    return [{
      source: "gdelt" as const,
      sourceRecordId: articleUrl,
      title,
      date: normalizeSeenDate(asString(row.seendate)),
      url: articleUrl,
      domain: asString(row.domain),
      sourceCountry: asString(row.sourcecountry),
      language: asString(row.language),
    }]
  })
}

function gdeltDate(value: Date) {
  return value.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)
}
function normalizeSeenDate(value: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}
function asString(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null }
