import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { searchPatentsLocal, type PatentSearchHit } from "@/lib/inapi/patent-search"

const STOPWORDS = new Set([
  "para","como","sobre","entre","desde","hasta","bajo","alto","baja","sistema","metodo","método","proceso","dispositivo","aparato","equipo","mediante","with","from","into","using","system","method","process","device","apparatus","equipment","low","high","the","and","for","that","this","una","uno","unos","unas","del","las","los","que","con","por","sin","sus","una","un",
])

export type PriorityClaim = { country: string | null; number: string; date: string }
export type PatentReviewLevel = "close_review" | "relevant" | "background"

export type PriorArtCandidate = PatentSearchHit & {
  technicalScore: number
  reviewLevel: PatentReviewLevel
  matchedConcepts: string[]
  reasons: string[]
  publicationDate: string | null
  pctApplicationDate: string | null
  pctPublicationDate: string | null
  prioritiesRaw: string | null
  priorityClaims: PriorityClaim[]
  familyCandidate: { key: string; sizeInResult: number } | null
  typeName: string | null
  subtypeName: string | null
}

export type PriorArtReview = {
  query: string
  ipc: string | null
  concepts: string[]
  searchStrategy: "full_query" | "concept_fallback" | "hybrid"
  candidates: PriorArtCandidate[]
  summary: { total: number; closeReview: number; relevant: number; background: number; familyCandidates: number }
  coverage: { source: "INAPI Chile"; scope: string; limitations: string[]; newestSync: string | null }
  generatedAt: string
}

type DetailRow = {
  id: string
  publication_date: string | null
  pct_application_date: string | null
  pct_publication_date: string | null
  priorities: string | null
  type_name: string | null
  subtype_name: string | null
}

export async function buildPatentPriorArtReview(query: string, ipc?: string | null, limit = 30): Promise<PriorArtReview> {
  const trimmed = query.trim()
  const concepts = extractTechnicalConcepts(trimmed)
  const full = await searchPatentsLocal(trimmed, ipc ?? null, Math.min(limit, 50))
  const merged = new Map<string, { hit: PatentSearchHit; conceptHits: Set<string>; fullHit: boolean }>()

  for (const hit of full.hits) merged.set(hit.id, { hit, conceptHits: new Set(), fullHit: true })

  const shouldFallback = full.hits.length < Math.min(8, limit) || concepts.length >= 2
  if (shouldFallback && concepts.length) {
    const searches = await Promise.all(concepts.slice(0, 6).map(async concept => ({ concept, result: await searchPatentsLocal(concept, ipc ?? null, 35) })))
    for (const { concept, result } of searches) {
      for (const hit of result.hits) {
        const current = merged.get(hit.id) ?? { hit, conceptHits: new Set<string>(), fullHit: false }
        if (normalizeText(hit.title).includes(normalizeText(concept))) current.conceptHits.add(concept)
        if (hit.relevanceScore > current.hit.relevanceScore) current.hit = hit
        merged.set(hit.id, current)
      }
    }
  }

  const ids = [...merged.keys()]
  const details = new Map<string, DetailRow>()
  if (ids.length) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("patent_records")
      .select("id,publication_date,pct_application_date,pct_publication_date,priorities,type_name,subtype_name")
      .in("id", ids)
    if (error) throw new Error(`Patent detail enrichment failed: ${error.message}`)
    for (const row of (data ?? []) as DetailRow[]) details.set(row.id, row)
  }

  const preliminary = [...merged.values()].map(({ hit, conceptHits, fullHit }) => {
    const detail = details.get(hit.id)
    const title = normalizeText(hit.title)
    const matchedConcepts = concepts.filter(concept => title.includes(normalizeText(concept)))
    for (const concept of conceptHits) if (!matchedConcepts.includes(concept)) matchedConcepts.push(concept)
    const conceptCoverage = concepts.length ? matchedConcepts.length / concepts.length : 0
    const fullQueryBonus = fullHit && hit.titleSimilarity >= 0.2 ? 10 : 0
    const ipcBonus = ipc && hit.ipc.some(code => code.toUpperCase().startsWith(ipc.toUpperCase())) ? 10 : 0
    const technicalScore = Math.min(100, Math.round(conceptCoverage * 70 + Math.min(20, hit.titleSimilarity * 20) + fullQueryBonus + ipcBonus))
    const priorityClaims = parsePriorityClaims(detail?.priorities ?? null)
    const familyKey = priorityClaims[0] ? `${priorityClaims[0].country ?? "XX"}:${normalizePriorityNumber(priorityClaims[0].number)}` : null
    const reasons = buildReasons({ matchedConcepts, ipc, ipcCodes: hit.ipc, priorityClaims, pctApplicationDate: detail?.pct_application_date ?? null, status: hit.status })

    return {
      ...hit,
      technicalScore,
      reviewLevel: reviewLevel(technicalScore),
      matchedConcepts,
      reasons,
      publicationDate: detail?.publication_date ?? null,
      pctApplicationDate: detail?.pct_application_date ?? null,
      pctPublicationDate: detail?.pct_publication_date ?? null,
      prioritiesRaw: detail?.priorities ?? null,
      priorityClaims,
      familyKey,
      typeName: detail?.type_name ?? null,
      subtypeName: detail?.subtype_name ?? null,
    }
  }).filter(item => item.matchedConcepts.length > 0 || item.technicalScore >= 30)

  const familyCounts = new Map<string, number>()
  for (const item of preliminary) if (item.familyKey) familyCounts.set(item.familyKey, (familyCounts.get(item.familyKey) ?? 0) + 1)

  const candidates: PriorArtCandidate[] = preliminary
    .sort((a, b) => b.technicalScore - a.technicalScore || (b.filingDate ?? "").localeCompare(a.filingDate ?? ""))
    .slice(0, Math.max(1, Math.min(limit, 50)))
    .map(({ familyKey, ...item }) => ({
      ...item,
      familyCandidate: familyKey ? { key: familyKey, sizeInResult: familyCounts.get(familyKey) ?? 1 } : null,
    }))

  const strategy: PriorArtReview["searchStrategy"] = full.hits.length === 0 ? "concept_fallback" : shouldFallback ? "hybrid" : "full_query"
  const newestSync = [...new Set(candidates.map(item => item.lastSyncedAt).filter((value): value is string => Boolean(value)))].sort().at(-1) ?? full.newestSync

  return {
    query: trimmed,
    ipc: ipc?.trim() || null,
    concepts,
    searchStrategy: strategy,
    candidates,
    summary: {
      total: candidates.length,
      closeReview: candidates.filter(item => item.reviewLevel === "close_review").length,
      relevant: candidates.filter(item => item.reviewLevel === "relevant").length,
      background: candidates.filter(item => item.reviewLevel === "background").length,
      familyCandidates: new Set(candidates.map(item => item.familyCandidate?.key).filter(Boolean)).size,
    },
    coverage: {
      source: "INAPI Chile",
      scope: "Antecedentes observados en el corpus sincronizado de solicitudes y registros de patentes en Chile.",
      limitations: [
        "Una coincidencia es un candidato de prior art para revisión, no una conclusión sobre novedad o actividad inventiva.",
        "Los grupos de familia se infieren sólo desde prioridades observadas en INAPI y no sustituyen una familia global consolidada.",
        "FTO y patentability requieren cobertura internacional, estado jurídico y revisión profesional adicionales.",
        "Citations no se muestran mientras no exista una fuente canónica verificable integrada.",
      ],
      newestSync,
    },
    generatedAt: new Date().toISOString(),
  }
}

export function extractTechnicalConcepts(value: string) {
  const normalized = normalizeText(value)
  const seen = new Set<string>()
  const result: string[] = []
  for (const token of normalized.split(/\s+/)) {
    if (token.length < 4 || STOPWORDS.has(token) || /^\d+$/.test(token) || seen.has(token)) continue
    seen.add(token)
    result.push(token)
  }
  return result.slice(0, 8)
}

export function parsePriorityClaims(value: string | null): PriorityClaim[] {
  if (!value) return []
  const claims: PriorityClaim[] = []
  for (const part of value.split(";").map(item => item.trim()).filter(Boolean)) {
    const match = part.match(/^\(([A-Z]{2})\)\s+(.+?)\s+(\d{2}\.\d{2}\.\d{4})$/i) ?? part.match(/^(.+?)\s+(\d{2}\.\d{2}\.\d{4})$/)
    if (!match) continue
    const hasCountry = match.length === 4
    const country = hasCountry ? match[1].toUpperCase() : null
    const number = (hasCountry ? match[2] : match[1]).trim()
    const rawDate = hasCountry ? match[3] : match[2]
    const [day, month, year] = rawDate.split(".")
    claims.push({ country, number, date: `${year}-${month}-${day}` })
  }
  return claims.sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number))
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function normalizePriorityNumber(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

function reviewLevel(score: number): PatentReviewLevel {
  if (score >= 65) return "close_review"
  if (score >= 35) return "relevant"
  return "background"
}

function buildReasons(input: { matchedConcepts: string[]; ipc?: string | null; ipcCodes: string[]; priorityClaims: PriorityClaim[]; pctApplicationDate: string | null; status: string | null }) {
  const reasons: string[] = []
  if (input.matchedConcepts.length) reasons.push(`Coincidencia técnica: ${input.matchedConcepts.slice(0, 4).join(", ")}`)
  if (input.ipc && input.ipcCodes.some(code => code.toUpperCase().startsWith(input.ipc!.toUpperCase()))) reasons.push(`Coincidencia IPC ${input.ipc.toUpperCase()}`)
  if (input.priorityClaims.length) reasons.push(`${input.priorityClaims.length} prioridad${input.priorityClaims.length === 1 ? "" : "es"} observada${input.priorityClaims.length === 1 ? "" : "s"}`)
  if (input.pctApplicationDate) reasons.push("Trámite PCT observado")
  if (input.status) reasons.push(`Estado INAPI observado: ${input.status}`)
  return reasons
}
