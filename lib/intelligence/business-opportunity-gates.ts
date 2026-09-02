export type BusinessOpportunityAxis = "frontier" | "market_pull" | "company_fit"
export type BusinessOpportunityGateStatus = "eligible" | "context_only" | "rejected"

export type BusinessOpportunityGateEvidence = {
  axis: BusinessOpportunityAxis
  gateStatus: BusinessOpportunityGateStatus
}

export type BusinessOpportunityGateSummary = {
  eligibleAxes: BusinessOpportunityAxis[]
  missingAxes: BusinessOpportunityAxis[]
  canBetNow: boolean
}

const REQUIRED_AXES: readonly BusinessOpportunityAxis[] = ["frontier", "market_pull", "company_fit"]

export function summarizeBusinessOpportunityEvidence(
  evidence: BusinessOpportunityGateEvidence[],
): BusinessOpportunityGateSummary {
  const eligible = new Set<BusinessOpportunityAxis>()
  for (const item of evidence) {
    if (item.gateStatus === "eligible") eligible.add(item.axis)
  }

  const eligibleAxes = REQUIRED_AXES.filter(axis => eligible.has(axis))
  const missingAxes = REQUIRED_AXES.filter(axis => !eligible.has(axis))

  return {
    eligibleAxes,
    missingAxes,
    canBetNow: missingAxes.length === 0,
  }
}

export function assertBusinessOpportunityTier(
  tier: "watch" | "validate" | "bet_now",
  evidence: BusinessOpportunityGateEvidence[],
) {
  const summary = summarizeBusinessOpportunityEvidence(evidence)
  if (tier === "bet_now" && !summary.canBetNow) {
    throw new Error(`BET NOW requires eligible evidence for: ${summary.missingAxes.join(", ")}`)
  }
  return summary
}
