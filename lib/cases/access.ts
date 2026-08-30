export type CaseAccessRole = "owner" | "editor" | "viewer"

export type CaseSuggestedAction =
  | "remind_reviewers"
  | "extend_deadline"
  | "raise_priority"
  | "open_governance"
  | "investigate"
  | "none"

type ApprovalRoundInput = {
  caseId: string
  reviewerIds: string[]
  message: string
  role: CaseAccessRole
  requiredApprovals: number
  deadlineDays: number
}

export function canEditCase(role: CaseAccessRole) {
  return role === "owner" || role === "editor"
}

export function buildApprovalRoundRequest(input: ApprovalRoundInput) {
  const request: {
    mode: "round"
    caseId: string
    reviewerIds: string[]
    message: string
    requiredApprovals?: number
    deadlineDays?: number
    blockOnChanges?: boolean
  } = {
    mode: "round",
    caseId: input.caseId,
    reviewerIds: input.reviewerIds,
    message: input.message,
  }

  if (input.role === "owner") {
    request.requiredApprovals = input.requiredApprovals
    request.deadlineDays = input.deadlineDays
    request.blockOnChanges = true
  }

  return request
}

export function canExecuteCaseSuggestedAction(role: CaseAccessRole, action: CaseSuggestedAction) {
  if (action === "none") return false
  if (action === "open_governance" || action === "investigate") return true
  if (action === "extend_deadline") return role === "owner"
  return canEditCase(role)
}

export function caseSuggestedActionRestriction(role: CaseAccessRole, action: CaseSuggestedAction) {
  if (canExecuteCaseSuggestedAction(role, action) || action === "none") return null
  if (action === "extend_deadline") return "Requiere al responsable del caso"
  return "Requiere rol de editor o responsable"
}
