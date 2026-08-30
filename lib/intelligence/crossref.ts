const CROSSREF_BASE = "https://api.crossref.org/works"
const TIMEOUT_MS = 9000

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
  url.searchParams.set("query.bibliographic", query)
  url.searchParams.set("filter", `from-pub-date:${dateOnly(from)},until-pub-date:${dateOnly(to)}`)
  url.searchParams.set("sort", "published")
  url.searchParams.set("order", "desc")
  url.searchParams.set("rows", String(Math.min(Math.max(limit, 1), 20)))

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
  })
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
