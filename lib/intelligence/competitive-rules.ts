export type SpaceMovement = "entrante" | "experimental" | "acelerando" | "consolidado" | "retirandose" | "sin_senal"

export function classifySpaceMovement(current: number, previous: number): SpaceMovement {
  if (current >= 2 && previous === 0) return "entrante"
  if (current === 1 && previous === 0) return "experimental"
  if (previous > 0 && current >= previous + 2 && current >= previous * 1.5) return "acelerando"
  if (current > 0 && previous > 0) return "consolidado"
  if (current === 0 && previous > 0) return "retirandose"
  return "sin_senal"
}

export function isPortfolioGap(ownFilings: number, competitorFilings: number) {
  return ownFilings === 0 && competitorFilings >= 2
}

export type RecommendationFactors = {
  competitorFilings: number
  ownFilings: number
  activeQuarters: number
  entrantCompanies: number
  currentCompanies: number
  exactClassification?: boolean
}

export type RecommendationScore = {
  total: number
  tier: "alta" | "media" | "observacion"
  components: {
    materiality: number
    novelty: number
    convergence: number
    persistence: number
    proximity: number
  }
}

export function scoreRecommendation(factors: RecommendationFactors): RecommendationScore {
  const materiality = Math.min(25, Math.max(0, factors.competitorFilings) * 5)
  const novelty = factors.ownFilings === 0 ? 20 : factors.ownFilings === 1 ? 10 : 0
  const convergence = Math.min(
    20,
    Math.max(0, factors.entrantCompanies) * 3 + Math.min(8, Math.max(0, factors.currentCompanies)),
  )
  const persistence = Math.min(20, Math.max(0, factors.activeQuarters) * 5)
  const proximity = factors.exactClassification === false ? 8 : 15
  const total = Math.round(materiality + novelty + convergence + persistence + proximity)

  return {
    total,
    tier: total >= 75 ? "alta" : total >= 55 ? "media" : "observacion",
    components: { materiality, novelty, convergence, persistence, proximity },
  }
}
