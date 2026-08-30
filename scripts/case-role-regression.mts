import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import {
  buildApprovalRoundRequest,
  canEditCase,
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

assert.equal(canEditCase("owner"), true)
assert.equal(canEditCase("editor"), true)
assert.equal(canEditCase("viewer"), false)

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

const itemsRoutePath = fileURLToPath(new URL("../app/api/cases/items/route.ts", import.meta.url))
const detailPagePath = fileURLToPath(new URL("../app/(app)/casos/[id]/page.tsx", import.meta.url))
const [itemsRouteSource, detailPageSource] = await Promise.all([
  readFile(itemsRoutePath, "utf8"),
  readFile(detailPagePath, "utf8"),
])

assert.match(itemsRouteSource, /rpc\("case_access_role"/, "case detail API must resolve the effective case role")
assert.match(itemsRouteSource, /currentUserRole: role/, "case detail API must return the effective case role")
assert.match(detailPageSource, /useState<CaseAccessRole>\("viewer"\)/, "case detail must fail closed to viewer mode")
assert.match(detailPageSource, /const canEdit = canEditCase\(currentUserRole\)/, "case detail must gate editing through the shared role policy")

console.log("Case role regression PASS: review policy ownership, viewer detail mode and suggested-action permissions verified.")
