const CROSSREF_BASE = "https://api.crossref.org/works"
const TIMEOUT_MS = 9000
const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "y", "e", "en", "con", "para", "por", "un", "una", "the", "of", "and", "in", "for", "to", "on", "with"])

export type CrossrefWorkSignal = {
  source: "crossref"
  sourceRecordId: string
  title: string
  date: string | null
  url: string
  doi: string
  publisher: string | null
  authors: string[]
  subjects: string[]
  citedByCount: number
}

type CrossrefResponse = {
  message?: { items?: Array<Record<string, unknown>> }
}

export async function searchCrossrefWorks(query: string, from: Date, to: Date, limit = 8): Promise<CrossrefWorkSignal[]> {
  const url = new URL(CROSSREF_BASE)
  // Technology evidence is title-led. Bibliographic search can rank papers that only
  // match a generic token in unrelated metadata, which is too noisy for VIDENTIA.
  url.searchParams.set("query.title", query)
  url.searchParams.set("filter", `from-pub-date:${dateOnly(from)},until-pub-date:${dateOnly(to)}`)
  // Keep Crossref's relevance ranking and fetch extra candidates because the local
  // topical filter intentionally prefers precision over recall.
  url.searchParams.set("rows", String(Math.min(Math.max(limit * 2, 8), 20)))

  const mailto = String(process.env.CROSSREF_MAILTO ?? "").trim()
  if (mailto) url.searchParams.set("mailto", mailto)

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "VIDENTIA/1.0" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Crossref respondió ${response.status}`)

  const payload = await response.json() as CrossrefResponse
  return (payload.message?.items ?? []).flatMap(row => {
    const doi = asString(row.DOI)
    const titles = Array.isArray(row.title) ? row.title : []
    const title = titles.map(asString).find(Boolean) ?? null
    if (!doi || !title) return []

    const authors = (Array.isArray(row.author) ? row.author as Array<Record<string, unknown>> : []).flatMap(author => {
      const given = asString(author.given)
      const family = asString(author.family)
      const full = [given, family].filter(Boolean).join(" ").trim()
      return full ? [full] : []
    }).slice(0, 8)

    const subjects = (Array.isArray(row.subject) ? row.subject : []).flatMap(value => {
      const subject = asString(value)
      return subject ? [subject] : []
    }).slice(0, 8)

    if (!isCrossrefQueryRelevant(query, title, subjects)) return []

    return [{
      source: "crossref" as const,
      sourceRecordId: doi,
      title,
      date: extractDate(row),
      url: asString(row.URL) ?? `https://doi.org/${doi}`,
      doi,
      publisher: asString(row.publisher),
      authors,
      subjects,
      citedByCount: Number(row["is-referenced-by-count"] ?? 0),
    }]
  }).slice(0, Math.min(Math.max(limit, 1), 20))
}

export function isCrossrefQueryRelevant(query: string, title: string, subjects: string[] = []) {
  const terms = unique(significantTokens(query))
  if (!terms.length) return true

  const evidenceTokens = new Set(significantTokens([title, ...subjects].join(" ")))
  const matches = terms.filter(term => evidenceTokens.has(term)).length
  const requiredMatches = terms.length === 1 ? 1 : Math.min(2, terms.length)
  return matches >= requiredMatches
}

function significantTokens(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 4 && !STOPWORDS.has(token))
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function extractDate(row: Record<string, unknown>) {
  for (const key of ["published-online", "published-print", "published", "created"]) {
    const value = row[key]
    if (!value || typeof value !== "object") continue
    const parts = (value as { [key: string]: unknown })["date-parts"]
    if (!Array.isArray(parts) || !Array.isArray(parts[0])) continue
    const [year, month = 1, day = 1] = parts[0].map(Number)
    if (!Number.isFinite(year)) continue
    return new Date(Date.UTC(year, Math.max(0, month - 1), Math.max(1, day))).toISOString().slice(0, 10)
  }
  return null
}

function dateOnly(value: Date) { return value.toISOString().slice(0, 10) }
function asString(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null }
function unique(values: string[]) { return [...new Set(values)] }
