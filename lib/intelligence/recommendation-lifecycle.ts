import "server-only"

export type RecommendationStatus = "new" | "reviewed" | "accepted" | "discarded" | "converted_to_action"

export type RecommendationLifecycle = {
  id: string
  status: RecommendationStatus
  discard_reason: string | null
  case_id: string | null
  action_id: string | null
  updated_at: string
}

export function portfolioGapRecommendationKey(
  ownIdentityId: string,
  competitorIdentityId: string,
  assetType: "patent" | "trademark",
  code: string,
) {
  return `portfolio-gap:${ownIdentityId}:${competitorIdentityId}:${assetType}:${code.trim()}`
}

export function recommendationPriority(tier: string) {
  if (tier === "alta") return "high"
  if (tier === "observacion") return "low"
  return "normal"
}

export function isTerminalRecommendationStatus(status: string) {
  return status === "discarded" || status === "converted_to_action"
}
