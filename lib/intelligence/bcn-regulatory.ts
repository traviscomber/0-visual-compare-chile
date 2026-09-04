import "server-only"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const BCN_SPARQL_ENDPOINT = "https://datos.bcn.cl/sparql"
const MAX_RESULTS = 25

export type BcnRegulatorySignal = {
  source: "bcn_norms"
  sourceRecordId: string
  title: string
  sourceUrl: string
  publicationDate: string | null
  normType: string | null
  organization: string | null
  number: string | null
}

type SparqlBinding = {
  id?: { value?: string }
  title?: { value?: string }
  norma?: { value?: string }
  publishDate?: { value?: string }
}

type SparqlPayload = {
  results?: { bindings?: SparqlBinding[] }
}

export async function searchBcnRegulations(query: string, limit = 12): Promise<BcnRegulatorySignal[]> {
  const normalized = query.replace(/[\u0000-\u001f]/g, " ").trim()
  if (normalized.length < 2) return []

  const safeLimit = Math.max(1, Math.min(MAX_RESULTS, Math.trunc(limit)))
  const sparql = buildQuery(normalized, Math.max(safeLimit * 3, 20))
  const url = new URL(BCN_SPARQL_ENDPOINT)
  url.searchParams.set("query", sparql)
  url.searchParams.set("format", "application/sparql-results+json")

  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: {
      Accept: "application/sparql-results+json, application/json",
      "User-Agent": "VIDENTIA/1.0 regulatory-intelligence",
    },
  }, { attempts: 2, baseDelayMs: 500, timeoutMs: 12_000 })

  if (!response.ok) throw new Error(`BCN SPARQL respondió ${response.status}`)

  const payload = await response.json() as SparqlPayload
  const rows = payload.results?.bindings ?? []
  const unique = new Map<string, BcnRegulatorySignal>()

  for (const binding of rows) {
    const sourceUrl = cleanUrl(binding.norma?.value)
    const title = cleanText(binding.title?.value)
    const sourceRecordId = cleanText(binding.id?.value) || sourceUrl
    if (!sourceUrl || !title || !sourceRecordId) continue

    const uri = parseBcnNormUri(sourceUrl)
    const publicationDate = normalizeDate(binding.publishDate?.value) || uri.publicationDate
    unique.set(sourceRecordId, {
      source: "bcn_norms",
      sourceRecordId,
      title,
      sourceUrl,
      publicationDate,
      normType: uri.normType,
      organization: uri.organization,
      number: uri.number,
    })
    if (unique.size >= safeLimit) break
  }

  return [...unique.values()]
}

function buildQuery(query: string, limit: number) {
  const literal = escapeSparqlString(query.toLowerCase())
  const slug = escapeSparqlString(toUriSlug(query))
  return `PREFIX bcnnorms: <http://datos.bcn.cl/ontologies/bcn-norms#>\nPREFIX dc: <http://purl.org/dc/elements/1.1/>\nSELECT DISTINCT ?id ?title ?norma ?publishDate\nWHERE {\n  ?norma dc:identifier ?id .\n  ?norma dc:title ?title .\n  ?norma a bcnnorms:Norm .\n  OPTIONAL { ?norma bcnnorms:publishDate ?publishDate . }\n  FILTER(\n    CONTAINS(LCASE(STR(?title)), \"${literal}\") ||\n    CONTAINS(LCASE(STR(?norma)), \"${slug}\")\n  )\n}\nORDER BY DESC(?publishDate)\nLIMIT ${limit}`
}

function parseBcnNormUri(value: string) {
  try {
    const url = new URL(value)
    const parts = url.pathname.split("/").filter(Boolean)
    const cl = parts.indexOf("cl")
    if (cl < 0) return emptyUriParts()
    const normType = decodeSegment(parts[cl + 1])
    const organization = decodeSegment(parts[cl + 2])
    const publicationDate = normalizeDate(parts[cl + 3])
    const number = decodeSegment(parts[cl + 4])
    return { normType, organization, publicationDate, number }
  } catch {
    return emptyUriParts()
  }
}

function emptyUriParts() {
  return { normType: null as string | null, organization: null as string | null, publicationDate: null as string | null, number: null as string | null }
}

function decodeSegment(value?: string) {
  if (!value) return null
  return decodeURIComponent(value).replace(/-/g, " ").trim() || null
}

function normalizeDate(value?: string) {
  if (!value) return null
  const match = value.match(/\d{4}-\d{2}-\d{2}/)
  return match?.[0] ?? null
}

function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || null
}

function cleanUrl(value?: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.hostname !== "datos.bcn.cl") return null
    return url.toString()
  } catch {
    return null
  }
}

function toUriSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function escapeSparqlString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\"/g, '\\"').replace(/\r?\n/g, " ")
}
