import "server-only"
import { matchDomainTerms, matchesCompany, type CorroborationEvidence } from "@/lib/intelligence/competitive-expansion-corroboration"

export type HypothesisMonitoringAssessment = "strengthening_signal" | "contradictory_signal" | "source_degradation" | "stale_review_due" | "no_material_change"

const CONTRADICTORY_TERMS = [
  "exit", "exits", "exiting", "withdraw", "withdraws", "withdrawal", "cancel", "cancels", "cancelled", "canceled",
  "discontinue", "discontinues", "discontinued", "abandona", "abandono", "retira", "retiro", "cancela", "cancelado", "cierre", "cesa",
]

export function classifyContradictoryTitle(title: string, company: string, domainTerms: string[]) {
  if (!matchesCompany(title, company)) return null
  const matchedTerms = matchDomainTerms(title, domainTerms)
  if (!matchedTerms.length) return null
  const normalized = normalize(title)
  const matchedContradiction = CONTRADICTORY_TERMS.find(term => normalized.includes(normalize(term)))
  if (!matchedContradiction) return null
  return { matchedTerms, matchedContradiction }
}

export function assessHypothesisMonitoring(input: {
  freshEvidence: CorroborationEvidence[]
  contradictoryEvidence: CorroborationEvidence[]
  baselineEvidence: Array<{ source?: unknown; title?: unknown }>
  sourceCoverage: Record<string, { available: boolean; evidence_count: number }>
  acceptedAt: string | null
  observedAt: string
}) {
  const baselineKeys = new Set(input.baselineEvidence.flatMap(item => {
    const title = typeof item?.title === "string" ? item.title : ""
    const source = typeof item?.source === "string" ? item.source : ""
    return title ? [evidenceKey(source, title)] : []
  }))
  const newEvidence = input.freshEvidence.filter(item => !baselineKeys.has(evidenceKey(item.source, item.title)))
  const unavailable = Object.entries(input.sourceCoverage).filter(([, value]) => !value.available).map(([source]) => source)
  const acceptedAt = input.acceptedAt ? Date.parse(input.acceptedAt) : Number.NaN
  const observedAt = Date.parse(input.observedAt)
  const ageDays = Number.isFinite(acceptedAt) && Number.isFinite(observedAt) ? Math.floor((observedAt - acceptedAt) / 86400000) : null

  let assessment: HypothesisMonitoringAssessment = "no_material_change"
  let summary = "No se observaron cambios materiales frente al snapshot aceptado. La hipótesis permanece sujeta a revisión humana."
  if (input.contradictoryEvidence.length) {
    assessment = "contradictory_signal"
    summary = `Aparecieron ${input.contradictoryEvidence.length} señal${input.contradictoryEvidence.length === 1 ? "" : "es"} explícita${input.contradictoryEvidence.length === 1 ? "" : "s"} potencialmente contradictoria${input.contradictoryEvidence.length === 1 ? "" : "s"}. Requiere revisión humana; no invalida automáticamente la hipótesis.`
  } else if (newEvidence.length) {
    assessment = "strengthening_signal"
    summary = `Aparecieron ${newEvidence.length} evidencia${newEvidence.length === 1 ? " nueva" : "s nuevas"} compatible${newEvidence.length === 1 ? "" : "s"} con la hipótesis aceptada. Requiere revisión humana antes de modificar cualquier interpretación.`
  } else if (unavailable.length) {
    assessment = "source_degradation"
    summary = `La corrida perdió cobertura en ${unavailable.length} fuente${unavailable.length === 1 ? "" : "s"}: ${unavailable.join(", ")}. La degradación de cobertura es neutral y requiere revisión si afecta la decisión.`
  } else if (ageDays !== null && ageDays >= 90) {
    assessment = "stale_review_due"
    summary = `La hipótesis aceptada tiene ${ageDays} días sin nueva evidencia material. Esto no la vuelve falsa ni obsoleta; corresponde revisar vigencia y evidencia faltante.`
  }

  return { assessment, summary, newEvidence, unavailableSources: unavailable, ageDays }
}

export function evidenceKey(source: string, title: string) {
  return `${normalize(source)}:${normalize(title)}`
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim()
}
