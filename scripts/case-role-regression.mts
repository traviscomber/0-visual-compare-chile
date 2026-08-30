import assert from "node:assert/strict"
import {
  buildApprovalRoundRequest,
  canExecuteCaseSuggestedAction,
  caseSuggestedActionRestriction,
} from "../lib/cases/access.ts"

const common = {
  caseId: "00000000-0000-0000-0000-000000000001",
  reviewerIds: ["00000000-0000-0000-0000-000000000002"],
  message: "Revisar decisión",
  requiredApprovals: 1,
  deadlineDays: 3,
}

const ownerRequest = buildApprovalRoundRequest({ ...common, role: "owner" })
assert.equal(ownerRequest.requiredApprovals, 1)
assert.equal(ownerRequest.deadlineDays, 3)
assert.equal(ownerRequest.blockOnChanges, true)

const editorRequest = buildApprovalRoundRequest({ ...common, role: "editor" })
assert.equal("requiredApprovals" in editorRequest, false, "editor must use the owner's stored governance policy")
assert.equal("deadlineDays" in editorRequest, false, "editor must not attempt to update review deadline policy")
assert.equal("blockOnChanges" in editorRequest, false, "editor must not attempt to update block-on-change policy")

assert.equal(canExecuteCaseSuggestedAction("owner", "extend_deadline"), true)
assert.equal(canExecuteCaseSuggestedAction("editor", "extend_deadline"), false)
assert.equal(canExecuteCaseSuggestedAction("editor", "remind_reviewers"), true)
assert.equal(canExecuteCaseSuggestedAction("editor", "raise_priority"), true)
assert.equal(canExecuteCaseSuggestedAction("viewer", "raise_priority"), false)
assert.equal(canExecuteCaseSuggestedAction("viewer", "open_governance"), true)
assert.equal(canExecuteCaseSuggestedAction("viewer", "investigate"), true)
assert.equal(canExecuteCaseSuggestedAction("owner", "none"), false)
assert.equal(caseSuggestedActionRestriction("editor", "extend_deadline"), "Requiere al responsable del caso")
assert.equal(caseSuggestedActionRestriction("viewer", "remind_reviewers"), "Requiere rol de editor o responsable")

console.log("Case role regression PASS: review policy ownership and suggested-action permissions verified.")
