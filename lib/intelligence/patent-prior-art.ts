import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { searchPatentsLocal, type PatentSearchHit } from "@/lib/inapi/patent-search"
import { hasEpoOpsCredentials, searchEpoPatentFamiliesForReview, type EpoFamilySignal, type EpoPriorityClaim } from "@/lib/intelligence/epo-ops"
import { loadPatentLiteratureEvidence, type PatentLiteratureEvidence } from "@/lib/intelligence/patent-literature"

const STOPWORDS = new Set([
  "para","como","sobre","entre","desde","hasta","bajo","alto","baja","sistema","metodo","método","proceso","dispositivo","aparato","equipo","mediante","with","from","into","using","system","method","process","device","apparatus","equipment","low","high","the","and","for","that","this","una","uno","unos","unas","del","las","los","que","con","por","sin","sus","una","un",
])

export type PriorityClaim = { country: string | null; number: string; date: string }
export type PatentReviewLevel = "close_review" | "relevant" | "background"
export type GlobalEvidenceAvailability = "not_requested" | "credential_required" | "available" | "degraded"
export type ObservedPatentChangeType = "new_record" | "status_changed" | "registration_added" | "applicant_changed" | "classification_changed" | "title_changed" | "record_updated"

export type ObservedPatentFieldChange = {
  field: string
  before: string | null
  after: string | null
}

export type ObservedPatentChange = {
  eventType: ObservedPatentChangeType
  summary: string | null
  observedAt: string
  sourceDate: string | null
  materiality: "alta" | "media" | "baja"
  changedFields: string[]
  fieldChanges: ObservedPatentFieldChange[]
  sourceUrl: string | null
}

export type GlobalFamilyMatch = {
  sourceRecordId: string
  publication: string
  matchedPriorities: Array<{ country: string; localNumber: string; epoNumber: string; date: string }>
  jurisdictions: string[]
  evidenceCoverage: EpoFamilySignal["evidenceCoverage"]
}

export type GlobalPatentEvidence = {
  requested: boolean
  source: "EPO OPS"
  availability: GlobalEvidenceAvailability
  families: EpoFamilySignal[]
  limitations: string[]
}

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
  globalFamilyMatches: GlobalFamilyMatch[]
  typeName: string | null
  subtypeName: string | null
  observedChangeCount: number
  observedChanges: ObservedPatentChange[]
}

export type PriorArtReview = {
  query: string
  ipc: string | null
  concepts: string[]
  searchStrategy: "full_query" | "concept_fallback" | "hybrid"
  candidates: PriorArtCandidate[]
  summary: { total: number; closeReview: number; relevant: number; background: number; familyCandidates: number; candidatesWithObservedChanges: number; observedChanges: number; globalFamilyLinkedCandidates: number; literatureWorks: number }
  coverage: { source: "INAPI Chile"; scope: string; limitations: string[]; newestSync: string | null; changeObservationSince: string | null }
  globalEvidence: GlobalPatentEvidence
  literatureEvidence: PatentLiteratureEvidence
  generatedAt: string
}

type DetailRow = {
  id: string
  source_record_id: string
  publication_date: string | null
  pct_application_date: string | null
  pct_publication_date: string | null
  priorities: string | null
  type_name: string | null
  subtype_name: string | null
}

type SourceEventRow = {
  source_record_id: string
  event_type: ObservedPatentChangeType
  summary: string | null
  observed_at: string
  source_date: string | null
  materiality: "alta" | "media" | "baja"
  changed_fields: string[] | null
  before_snapshot: Record<string, unknown> | null
  after_snapshot: Record<string, unknown> | null
  source_url: string | null
}

export async function buildPatentPriorArtReview(
  query: string,
  ipc?: string | null,
  limit = 30,
  options: { includeGlobal?: boolean; includeLiterature?: boolean } = {},
): Promise<PriorArtReview> {
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
  const observedChangesBySource = new Map<string, ObservedPatentChange[]>()
  let changeObservationSince: string | null = null

  if (ids.length) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("patent_records")
      .select("id,source_record_id,publication_date,pct_application_date,pct_publication_date,priorities,type_name,subtype_name")
      .in("id", ids)
    if (error) throw new Error(`Patent detail enrichment failed: ${error.message}`)
    for (const row of (data ?? []) as DetailRow[]) details.set(row.id, row)

    const sourceRecordIds = [...new Set([...details.values()].map(row => row.source_record_id).filter(Boolean))]
    if (sourceRecordIds.length) {
      const { data: changeRows, error: changeError } = await admin
        .from("intelligence_source_events")
        .select("source_record_id,event_type,summary,observed_at,source_date,materiality,changed_fields,before_snapshot,after_snapshot,source_url")
        .eq("source_key", "inapi_open_data")
        .eq("entity_type", "patent")
        .in("source_record_id", sourceRecordIds)
        .order("observed_at", { ascending: false })
        .limit(500)

      if (changeError) throw new Error(`Patent observed-change enrichment failed: ${changeError.message}`)
      for (const row of (changeRows ?? []) as SourceEventRow[]) {
        const event = normalizeObservedChange(row)
        const current = observedChangesBySource.get(row.source_record_id) ?? []
        current.push(event)
        observedChangesBySource.set(row.source_record_id, current)
        if (!changeObservationSince || row.observed_at < changeObservationSince) changeObservationSince = row.observed_at
      }
    }
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
    const observedChanges = detail?.source_record_id ? observedChangesBySource.get(detail.source_record_id) ?? [] : []

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
      observedChangeCount: observedChanges.length,
      observedChanges: observedChanges.slice(0, 5),
    }
  }).filter(item => item.matchedConcepts.length > 0 || item.technicalScore >= 30)

  const familyCounts = new Map<string, number>()
  for (const item of preliminary) if (item.familyKey) familyCounts.set(item.familyKey, (familyCounts.get(item.familyKey) ?? 0) + 1)

  const candidatesBeforeGlobal = preliminary
    .sort((a, b) => b.technicalScore - a.technicalScore || (b.filingDate ?? "").localeCompare(a.filingDate ?? ""))
    .slice(0, Math.max(1, Math.min(limit, 50)))
    .map(({ familyKey, ...item }) => ({
      ...item,
      familyCandidate: familyKey ? { key: familyKey, sizeInResult: familyCounts.get(familyKey) ?? 1 } : null,
    }))

  const strategy: PriorArtReview["searchStrategy"] = full.hits.length === 0 ? "concept_fallback" : shouldFallback ? "hybrid" : "full_query"
  const priorityClaimsForGlobal = candidatesBeforeGlobal.flatMap(item => item.priorityClaims)
  const [globalEvidence, literatureEvidence] = await Promise.all([
    loadGlobalPatentEvidence(trimmed, Boolean(options.includeGlobal), priorityClaimsForGlobal),
    loadPatentLiteratureEvidence(trimmed, Boolean(options.includeLiterature), 10),
  ])
  const candidates: PriorArtCandidate[] = candidatesBeforeGlobal.map(item => {
    const globalFamilyMatches = matchGlobalFamilies(item.priorityClaims, globalEvidence.families)
    return {
      ...item,
      globalFamilyMatches,
      reasons: globalFamilyMatches.length
        ? [...item.reasons, `Vínculo EPO por prioridad observada: ${globalFamilyMatches.map(match => match.publication).slice(0, 3).join(", ")}`]
        : item.reasons,
    }
  })
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
      candidatesWithObservedChanges: candidates.filter(item => item.observedChangeCount > 0).length,
      observedChanges: candidates.reduce((sum, item) => sum + item.observedChangeCount, 0),
      globalFamilyLinkedCandidates: candidates.filter(item => item.globalFamilyMatches.length > 0).length,
      literatureWorks: literatureEvidence.works.length,
    },
    coverage: {
      source: "INAPI Chile",
      scope: "Antecedentes observados en el corpus sincronizado de solicitudes y registros de patentes en Chile.",
      limitations: [
        "Una coincidencia es un candidato de prior art para revisión, no una conclusión sobre novedad o actividad inventiva.",
        "Los cambios observados comparan snapshots sucesivos del dataset oficial desde que VIDENTIA inicializó su baseline; no reconstruyen la historia completa del expediente.",
        "Los grupos de familia locales se infieren desde prioridades observadas en INAPI y no sustituyen una familia global consolidada.",
        "Los vínculos INAPI ↔ EPO se declaran sólo cuando una prioridad observada coincide por país, fecha y variante normalizada del número dentro de las familias EPO recuperadas; la ausencia de vínculo no demuestra ausencia de familia global.",
        "Los eventos jurídicos EPO se presentan como eventos de fuente; no se sintetizan como estado jurídico consolidado.",
        "Las citas y familias EPO aparecen sólo cuando se solicita cobertura global y la fuente responde.",
        "Un resultado vacío no demuestra ausencia de prior art, familia, citas, derechos activos ni eventos jurídicos.",
        "FTO y patentability requieren cobertura suficiente por jurisdicción y revisión profesional adicional.",
      ],
      newestSync,
      changeObservationSince,
    },
    globalEvidence,
    literatureEvidence,
    generatedAt: new Date().toISOString(),
  }
}

async function loadGlobalPatentEvidence(query: string, requested: boolean, priorityClaims: PriorityClaim[]): Promise<GlobalPatentEvidence> {
  const commonLimitations = [
    "EPO OPS aporta evidencia bibliográfica, familias simples, prioridades, citas observadas y eventos jurídicos de fuente; no una conclusión legal.",
    "La recuperación global prioriza números de prioridad observados en los candidatos INAPI y completa el cupo con title/abstract cuando corresponde; sigue siendo una revisión acotada, no una búsqueda exhaustiva.",
    "La ausencia de resultados o eventos en la respuesta no equivale a ausencia de derechos, citas o actividad en una jurisdicción.",
  ]

  if (!requested) {
    return {
      requested: false,
      source: "EPO OPS",
      availability: "not_requested",
      families: [],
      limitations: ["La consulta internacional no fue enviada a EPO OPS."],
    }
  }

  if (!hasEpoOpsCredentials()) {
    return {
      requested: true,
      source: "EPO OPS",
      availability: "credential_required",
      families: [],
      limitations: ["EPO OPS requiere credenciales configuradas para activar cobertura internacional.", ...commonLimitations],
    }
  }

  try {
    const families = await searchEpoPatentFamiliesForReview(query, priorityClaims, 3)
    return {
      requested: true,
      source: "EPO OPS",
      availability: "available",
      families,
      limitations: commonLimitations,
    }
  } catch (error) {
    console.error("[patent-prior-art] EPO OPS enrichment failed", error instanceof Error ? error.message : String(error))
    return {
      requested: true,
      source: "EPO OPS",
      availability: "degraded",
      families: [],
      limitations: ["EPO OPS no respondió de forma utilizable en esta revisión; la evidencia INAPI permanece disponible.", ...commonLimitations],
    }
  }
}

function normalizeObservedChange(row: SourceEventRow): ObservedPatentChange {
  const changedFields = Array.isArray(row.changed_fields) ? row.changed_fields.slice(0, 10) : []
  const before = row.before_snapshot ?? {}
  const after = row.after_snapshot ?? {}
  return {
    eventType: row.event_type,
    summary: row.summary,
    observedAt: row.observed_at,
    sourceDate: row.source_date,
    materiality: row.materiality,
    changedFields,
    fieldChanges: changedFields.slice(0, 5).map(field => ({
      field,
      before: observedValue(before[field]),
      after: observedValue(after[field]),
    })),
    sourceUrl: row.source_url,
  }
}

function observedValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null
  if (Array.isArray(value)) return value.map(item => String(item)).join(", ").slice(0, 240) || null
  if (typeof value === "object") return JSON.stringify(value).slice(0, 240)
  return String(value).slice(0, 240)
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

function matchGlobalFamilies(localClaims: PriorityClaim[], families: EpoFamilySignal[]): GlobalFamilyMatch[] {
  if (!localClaims.length || !families.length) return []
  const matches: GlobalFamilyMatch[] = []

  for (const family of families) {
    if (family.evidenceCoverage.priorities !== "family_endpoint" || !family.priorityClaims.length) continue
    const matchedPriorities: GlobalFamilyMatch["matchedPriorities"] = []
    for (const local of localClaims) {
      if (!local.country) continue
      for (const epo of family.priorityClaims) {
        if (!priorityClaimsMatch(local, epo)) continue
        matchedPriorities.push({ country: local.country, localNumber: local.number, epoNumber: epo.number, date: local.date })
        break
      }
    }
    if (!matchedPriorities.length) continue
    matches.push({
      sourceRecordId: family.sourceRecordId,
      publication: family.publication,
      matchedPriorities,
      jurisdictions: family.jurisdictions,
      evidenceCoverage: family.evidenceCoverage,
    })
  }

  return matches.sort((a, b) => b.matchedPriorities.length - a.matchedPriorities.length || a.publication.localeCompare(b.publication))
}

function priorityClaimsMatch(local: PriorityClaim, epo: EpoPriorityClaim) {
  if (!local.country || local.country.toUpperCase() !== epo.country.toUpperCase()) return false
  if (epo.date && local.date !== epo.date) return false
  const localVariants = priorityNumberVariants(local.country, local.number, local.date)
  const epoVariants = priorityNumberVariants(epo.country, epo.number, epo.date)
  return [...localVariants].some(value => epoVariants.has(value))
}

function priorityNumberVariants(country: string, number: string, date: string | null) {
  const result = new Set<string>()
  const normalized = normalizePriorityNumber(number)
  const digits = number.replace(/\D/g, "")
  if (normalized) result.add(normalized)
  if (digits) result.add(digits)

  const slashParts = number.split("/")
  if (slashParts.length > 1) {
    const serial = slashParts.at(-1)?.replace(/\D/g, "") ?? ""
    if (serial) {
      result.add(serial)
      if (country.toUpperCase() === "US" && date && /^\d{4}-/.test(date)) result.add(`${serial}${date.slice(2, 4)}`)
    }
  }

  if (/\.\d\s*$/.test(number)) {
    const withoutCheckDigit = number.replace(/\.\d\s*$/, "").replace(/\D/g, "")
    if (withoutCheckDigit) result.add(withoutCheckDigit)
  }

  return result
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
