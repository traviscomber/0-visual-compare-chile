export type SnifaRiskLevel = "critical" | "high" | "medium" | "low"

export type SnifaRiskAssessment = {
  infringementCount: number
  gravisimaCount: number
  graveCount: number
  leveCount: number
  environmentalRiskLevel: SnifaRiskLevel
  environmentalRiskBasis: string[]
}

export function classifyEnvironmentalRisk(fineUta: number | null, sanctionDetail: string | null): SnifaRiskAssessment {
  const normalized = normalizeRiskText(sanctionDetail ?? "")
  const gravisimaCount = countWord(normalized, "gravisimas")
  const graveCount = countWord(normalized, "graves")
  const leveCount = countWord(normalized, "leves")
  const infringementCount = gravisimaCount + graveCount + leveCount
  const basis: string[] = []

  if (gravisimaCount > 0) basis.push(`${gravisimaCount} infracción(es) gravísima(s)`)
  if (graveCount > 0) basis.push(`${graveCount} infracción(es) grave(s)`)
  if (leveCount > 0) basis.push(`${leveCount} infracción(es) leve(s)`)
  if (fineUta != null) basis.push(`${fineUta.toLocaleString("es-CL")} UTA`)
  if (infringementCount > 0) basis.push(`${infringementCount} hecho(s) sancionados`)

  let environmentalRiskLevel: SnifaRiskLevel = "low"
  if (gravisimaCount > 0 || (fineUta ?? 0) >= 5000) environmentalRiskLevel = "critical"
  else if (graveCount > 0 || (fineUta ?? 0) >= 1000) environmentalRiskLevel = "high"
  else if (leveCount > 0 || (fineUta ?? 0) >= 100) environmentalRiskLevel = "medium"

  return {
    infringementCount,
    gravisimaCount,
    graveCount,
    leveCount,
    environmentalRiskLevel,
    environmentalRiskBasis: basis,
  }
}

function countWord(value: string, word: string) {
  if (!value || !word) return 0
  const matches = value.match(new RegExp(`\\b${escapeRegExp(word)}\\b`, "g"))
  return matches?.length ?? 0
}

function normalizeRiskText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
