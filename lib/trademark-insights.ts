import type { Marca, SearchResult } from "@/types/marca"

export type TrademarkRiskLevel = "high" | "medium" | "low"

interface RiskSummaryCounts {
  high: number
  medium: number
  low: number
}

export interface TrademarkExecutiveSummary {
  risk: TrademarkRiskLevel
  riskLabel: "Alta" | "Media" | "Rutina"
  title: string
  recommendation: string
  primaryResult: SearchResult | null
  criticalCount: number
  mediumCount: number
  lowCount: number
  registeredCount: number
  pendingCount: number
  deniedCount: number
  topNiza: string[]
  topStates: string[]
}

export function buildSearchExecutiveSummary(
  query: string,
  searchType: "nombre" | "niza" | "viena",
  results: SearchResult[],
): TrademarkExecutiveSummary {
  const riskCounts = buildRiskCounts(results, query, searchType)
  const primaryResult = results[0] ?? null
  const topStates = Array.from(countValues(results.map((result) => result.marca.estado)).entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([state, count]) => `${state} (${count})`)

  const topNiza = Array.from(countValues(results.flatMap((result) => result.marca.niza)).entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([code]) => code)

  const registeredCount = results.filter((result) => result.marca.estado === "Registrada").length
  const pendingCount = results.filter((result) => result.marca.estado === "Pendiente").length
  const deniedCount = results.filter((result) => result.marca.estado === "Denegada").length
  const risk = deriveGlobalRisk(riskCounts, primaryResult, searchType, query)
  const riskLabel = formatRiskLabel(risk)

  if (!primaryResult) {
    return {
      risk,
      riskLabel,
      title: "Sin antecedentes priorizados en esta muestra",
      recommendation:
        searchType === "nombre"
          ? "La consulta no devolvió coincidencias para priorizar. Revisa clases y fuente oficial antes de concluir disponibilidad o registrabilidad."
          : "La consulta no devolvió coincidencias para priorizar. Complementa con denominación, clases relacionadas y fuente oficial.",
      primaryResult: null,
      criticalCount: riskCounts.high,
      mediumCount: riskCounts.medium,
      lowCount: riskCounts.low,
      registeredCount,
      pendingCount,
      deniedCount,
      topNiza,
      topStates,
    }
  }

  return {
    risk,
    riskLabel,
    title:
      risk === "high"
        ? `Revisar primero: ${primaryResult.marca.nombre}`
        : risk === "medium"
          ? `Revisar contexto de ${primaryResult.marca.nombre}`
          : `Antecedente relacionado: ${primaryResult.marca.nombre}`,
    recommendation: buildRecommendation(risk, primaryResult, searchType, query),
    primaryResult,
    criticalCount: riskCounts.high,
    mediumCount: riskCounts.medium,
    lowCount: riskCounts.low,
    registeredCount,
    pendingCount,
    deniedCount,
    topNiza,
    topStates,
  }
}

export function buildTrademarkDetailSummary(marca: Marca, relatedResults: SearchResult[]): TrademarkExecutiveSummary {
  return buildSearchExecutiveSummary(marca.nombre, "nombre", relatedResults)
}

export function buildResultReason(
  result: SearchResult,
  query: string,
  searchType: "nombre" | "niza" | "viena",
): string {
  const normalizedQuery = normalizeValue(query)
  const normalizedName = normalizeValue(result.marca.nombre)

  if (searchType === "nombre") {
    if (normalizedName === normalizedQuery) return "Coincidencia exacta de denominación"
    if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
      return "Denominación parcialmente coincidente"
    }
    if (result.relevancia >= 85) return "Coincidencia nominal priorizada para revisión"
    return "Antecedente nominal relacionado"
  }

  if (searchType === "niza") {
    return result.marca.niza.includes(query) ? `Comparte clase Niza ${query}` : "Clase Niza relacionada"
  }

  return result.marca.viena.includes(query) ? `Comparte código Viena ${query}` : "Código Viena relacionado"
}

/**
 * Orden heurístico de revisión. El nombre histórico de la función se conserva por compatibilidad,
 * pero el valor no representa riesgo jurídico, probabilidad de registro ni una decisión de INAPI.
 */
export function buildResultRiskLevel(
  result: SearchResult,
  query: string,
  searchType: "nombre" | "niza" | "viena",
): TrademarkRiskLevel {
  const exactName = searchType === "nombre" && normalizeValue(result.marca.nombre) === normalizeValue(query)
  const isRegistered = result.marca.estado === "Registrada"

  if ((exactName && isRegistered) || (result.relevancia >= 92 && isRegistered)) return "high"
  if (result.relevancia >= 78 || (isRegistered && result.relevancia >= 65)) return "medium"
  return "low"
}

export function formatRiskLabel(risk: TrademarkRiskLevel): "Alta" | "Media" | "Rutina" {
  if (risk === "high") return "Alta"
  if (risk === "medium") return "Media"
  return "Rutina"
}

export function formatTrademarkDate(value: string): string {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}

function deriveGlobalRisk(
  counts: RiskSummaryCounts,
  primaryResult: SearchResult | null,
  searchType: "nombre" | "niza" | "viena",
  query: string,
): TrademarkRiskLevel {
  if (counts.high > 0) return "high"
  if (counts.medium >= 3) return "medium"
  if (primaryResult && buildResultRiskLevel(primaryResult, query, searchType) === "medium") return "medium"
  return "low"
}

function buildRiskCounts(
  results: SearchResult[],
  query: string,
  searchType: "nombre" | "niza" | "viena",
): RiskSummaryCounts {
  return results.reduce<RiskSummaryCounts>(
    (accumulator, result) => {
      const level = buildResultRiskLevel(result, query, searchType)
      accumulator[level] += 1
      return accumulator
    },
    { high: 0, medium: 0, low: 0 },
  )
}

function buildRecommendation(
  risk: TrademarkRiskLevel,
  primaryResult: SearchResult,
  searchType: "nombre" | "niza" | "viena",
  query: string,
): string {
  const reason = buildResultReason(primaryResult, query, searchType)
  const topNiza = primaryResult.marca.niza.slice(0, 2).join(", ") || "sin clase visible"

  if (risk === "high") {
    return `Prioriza este antecedente para revisión. ${reason}; estado ${primaryResult.marca.estado.toLowerCase()} y Niza ${topNiza}. La prioridad no predice registrabilidad.`
  }

  if (risk === "medium") {
    return `Revisa denominación, estado y alcance de clases antes de sacar conclusiones. ${reason}; Niza ${topNiza}.`
  }

  return `Mantén este antecedente como contexto y documenta la revisión de clases y fuente oficial. La ausencia de prioridad alta no implica disponibilidad.`
}

function countValues(values: string[]) {
  const map = new Map<string, number>()
  for (const value of values.filter(Boolean)) map.set(value, (map.get(value) ?? 0) + 1)
  return map
}

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}
