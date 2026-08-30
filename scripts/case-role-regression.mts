import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import {
  buildApprovalRoundRequest,
  canEditCase,
  canExecuteCaseSuggestedAction,
  caseSuggestedActionRestriction,
} from "../lib/cases/access.ts"
import { isCaseMemberTarget, validateCaseMemberTargets } from "../lib/cases/collaboration-targets.ts"

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

const memberA = "00000000-0000-0000-0000-000000000010"
const memberB = "00000000-0000-0000-0000-000000000011"
const outsider = "00000000-0000-0000-0000-000000000099"
const memberIds = [memberA, memberB]
assert.deepEqual(validateCaseMemberTargets([memberA, memberA, memberB], memberIds), { valid: true, targets: [memberA, memberB] })
assert.deepEqual(validateCaseMemberTargets([memberA, outsider], memberIds), { valid: false, targets: [] })
assert.deepEqual(validateCaseMemberTargets(new Array(21).fill(memberA), memberIds), { valid: false, targets: [] })
assert.equal(isCaseMemberTarget(memberA, memberIds), true)
assert.equal(isCaseMemberTarget(outsider, memberIds), false)
assert.equal(isCaseMemberTarget(null, memberIds), true)

const itemsRoutePath = fileURLToPath(new URL("../app/api/cases/items/route.ts", import.meta.url))
const detailPagePath = fileURLToPath(new URL("../app/(app)/casos/[id]/page.tsx", import.meta.url))
const collaborationRoutePath = fileURLToPath(new URL("../app/api/cases/collaboration/route.ts", import.meta.url))
const collaborationMigrationPath = fileURLToPath(new URL("../supabase/migrations/20260830031000_harden_case_collaboration_targets.sql", import.meta.url))
const [itemsRouteSource, detailPageSource, collaborationRouteSource, collaborationMigrationSource] = await Promise.all([
  readFile(itemsRoutePath, "utf8"),
  readFile(detailPagePath, "utf8"),
  readFile(collaborationRoutePath, "utf8"),
  readFile(collaborationMigrationPath, "utf8"),
])

assert.match(itemsRouteSource, /rpc\("case_access_role"/, "case detail API must resolve the effective case role")
assert.match(itemsRouteSource, /currentUserRole: role/, "case detail API must return the effective case role")
assert.match(detailPageSource, /useState<CaseAccessRole>\("viewer"\)/, "case detail must fail closed to viewer mode")
assert.match(detailPageSource, /const canEdit = canEditCase\(currentUserRole\)/, "case detail must gate editing through the shared role policy")
assert.match(collaborationRouteSource, /validateCaseMemberTargets/, "collaboration API must validate comment mentions")
assert.match(collaborationRouteSource, /isCaseMemberTarget/, "collaboration API must validate action assignees")
assert.match(collaborationMigrationSource, /case_mention_target_not_member/, "database must reject external case mention targets")
assert.match(collaborationMigrationSource, /case_action_assignee_not_member/, "database must reject external case action assignees")
assert.match(collaborationMigrationSource, /before insert or update of case_id, mentions/, "comment target validation must run before notification triggers")
assert.match(collaborationMigrationSource, /before insert or update of case_id, assigned_to/, "action target validation must run before notification triggers")

console.log("Case role regression PASS: roles, viewer mode and collaboration notification targets verified.")
