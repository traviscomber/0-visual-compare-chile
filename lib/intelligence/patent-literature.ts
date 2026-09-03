import "server-only"
import { searchOpenAlexWorks, type OpenAlexWorkSignal } from "@/lib/intelligence/openalex"
import { searchCrossrefWorks, type CrossrefWorkSignal } from "@/lib/intelligence/crossref"

export type LiteratureSource = "openalex" | "crossref"
export type LiteratureSourceAvailability = "available" | "degraded"
export type LiteratureEvidenceAvailability = "not_requested" | "available" | "partial" | "degraded"

export type LiteratureSourceState = {
  source: LiteratureSource
  availability: LiteratureSourceAvailability
  resultCount: number
}

export type PatentLiteratureWork = {
  key: string
  title: string
  date: string | null
  url: string
  doi: string | null
  authors: string[]
  institutions: string[]
  publisher: string | null
  topic: string | null
  citedByCount: number
  sources: LiteratureSource[]
  bestSourceRank: number
}

export type PatentLiteratureEvidence = {
  requested: boolean
  availability: LiteratureEvidenceAvailability
  works: PatentLiteratureWork[]
  sources: LiteratureSourceState[]
  limitations: string[]
  searchedFrom: string | null
  searchedTo: string | null
}

const COMMON_LIMITATIONS = [
  "La literatura científica es evidencia técnica no-patente potencial; VIDENTIA no concluye por sí sola si una publicación destruye novedad o actividad inventiva.",
  "La fecha mostrada es la fecha bibliográfica recuperada desde la fuente. Antes de usarla jurídicamente debe verificarse el documento completo, su disponibilidad pública y la fecha relevante para la invención analizada.",
  "OpenAlex y Crossref tienen coberturas y criterios de indexación distintos. Un resultado vacío no demuestra ausencia de literatura técnica anterior.",
]

export async function loadPatentLiteratureEvidence(query: string, requested: boolean, limit = 10): Promise<PatentLiteratureEvidence> {
  if (!requested) {
    return {
      requested: false,
      availability: "not_requested",
      works: [],
      sources: [],
      limitations: ["La búsqueda de literatura científica no fue solicitada."],
      searchedFrom: null,
      searchedTo: null,
    }
  }

  const from = new Date("1900-01-01T00:00:00.000Z")
  const to = new Date()
  const boundedLimit = Math.min(Math.max(limit, 4), 12)
  const [openAlexResult, crossrefResult] = await Promise.allSettled([
    searchOpenAlexWorks(query, from, to, boundedLimit),
    searchCrossrefWorks(query, from, to, boundedLimit),
  ])

  const openAlex = openAlexResult.status === "fulfilled" ? openAlexResult.value : []
  const crossref = crossrefResult.status === "fulfilled" ? crossrefResult.value : []

  if (openAlexResult.status === "rejected") console.error("[patent-literature] OpenAlex failed", errorText(openAlexResult.reason))
  if (crossrefResult.status === "rejected") console.error("[patent-literature] Crossref failed", errorText(crossrefResult.reason))

  const sources: LiteratureSourceState[] = [
    { source: "openalex", availability: openAlexResult.status === "fulfilled" ? "available" : "degraded", resultCount: openAlex.length },
    { source: "crossref", availability: crossrefResult.status === "fulfilled" ? "available" : "degraded", resultCount: crossref.length },
  ]

  const availableSources = sources.filter(item => item.availability === "available").length
  const availability: LiteratureEvidenceAvailability = availableSources === 2 ? "available" : availableSources === 1 ? "partial" : "degraded"
  const works = mergeLiterature(openAlex, crossref, boundedLimit)
  const limitations = [...COMMON_LIMITATIONS]
  if (availability === "partial") limitations.unshift("Una de las dos fuentes bibliográficas no respondió de forma utilizable; los resultados visibles provienen sólo de la fuente disponible.")
  if (availability === "degraded") limitations.unshift("OpenAlex y Crossref no respondieron de forma utilizable en esta revisión; la evidencia patentaria INAPI permanece disponible.")

  return {
    requested: true,
    availability,
    works,
    sources,
    limitations,
    searchedFrom: from.toISOString().slice(0, 10),
    searchedTo: to.toISOString().slice(0, 10),
  }
}

function mergeLiterature(openAlex: OpenAlexWorkSignal[], crossref: CrossrefWorkSignal[], limit: number) {
  const merged = new Map<string, PatentLiteratureWork>()

  openAlex.forEach((work, index) => mergeWork(merged, {
    key: literatureKey(work.doi, work.title, work.date),
    title: work.title,
    date: work.date,
    url: work.url,
    doi: normalizeDoi(work.doi),
    authors: work.authors,
    institutions: work.institutions,
    publisher: null,
    topic: work.topic,
    citedByCount: work.citedByCount,
    sources: ["openalex"],
    bestSourceRank: index + 1,
  }))

  crossref.forEach((work, index) => mergeWork(merged, {
    key: literatureKey(work.doi, work.title, work.date),
    title: work.title,
    date: work.date,
    url: work.url,
    doi: normalizeDoi(work.doi),
    authors: work.authors,
    institutions: [],
    publisher: work.publisher,
    topic: work.subjects[0] ?? null,
    citedByCount: work.citedByCount,
    sources: ["crossref"],
    bestSourceRank: index + 1,
  }))

  return [...merged.values()]
    .sort((a, b) => b.sources.length - a.sources.length || a.bestSourceRank - b.bestSourceRank || b.citedByCount - a.citedByCount || (a.date ?? "").localeCompare(b.date ?? ""))
    .slice(0, limit)
}

function mergeWork(map: Map<string, PatentLiteratureWork>, incoming: PatentLiteratureWork) {
  const current = map.get(incoming.key)
  if (!current) {
    map.set(incoming.key, incoming)
    return
  }

  map.set(incoming.key, {
    ...current,
    date: earliestDate(current.date, incoming.date),
    url: preferredUrl(current.url, incoming.url, current.doi ?? incoming.doi),
    doi: current.doi ?? incoming.doi,
    authors: unique([...current.authors, ...incoming.authors]).slice(0, 8),
    institutions: unique([...current.institutions, ...incoming.institutions]).slice(0, 8),
    publisher: current.publisher ?? incoming.publisher,
    topic: current.topic ?? incoming.topic,
    citedByCount: Math.max(current.citedByCount, incoming.citedByCount),
    sources: unique([...current.sources, ...incoming.sources]) as LiteratureSource[],
    bestSourceRank: Math.min(current.bestSourceRank, incoming.bestSourceRank),
  })
}

function literatureKey(doi: string | null, title: string, date: string | null) {
  const normalizedDoi = normalizeDoi(doi)
  if (normalizedDoi) return `doi:${normalizedDoi}`
  return `title:${normalizeText(title)}:${date?.slice(0, 4) ?? "unknown"}`
}

function normalizeDoi(value: string | null) {
  if (!value) return null
  const clean = value.trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "").replace(/^doi:\s*/, "")
  return clean || null
}

function preferredUrl(current: string, incoming: string, doi: string | null) {
  if (doi) return `https://doi.org/${doi}`
  return current || incoming
}

function earliestDate(a: string | null, b: string | null) {
  if (!a) return b
  if (!b) return a
  return a <= b ? a : b
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function unique<T>(values: T[]) { return [...new Set(values)] }
function errorText(value: unknown) { return value instanceof Error ? value.message : String(value) }
