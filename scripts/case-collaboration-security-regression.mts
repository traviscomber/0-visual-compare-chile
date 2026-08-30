import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const apiPath = fileURLToPath(new URL("../app/api/cases/collaboration/route.ts", import.meta.url))
const migrationPath = fileURLToPath(new URL("../supabase/migrations/20260830030000_harden_case_collaboration_recipients.sql", import.meta.url))
const [apiSource, migrationSource] = await Promise.all([
  readFile(apiPath, "utf8"),
  readFile(migrationPath, "utf8"),
])

assert.match(apiSource, /from\("case_members"\).*\.in\("user_id", mentions\)/s, "comment mentions must be checked against case membership")
assert.match(apiSource, /from\("case_members"\).*\.eq\("user_id", assignedTo\)\.maybeSingle\(\)/s, "action assignee must be checked against case membership")
assert.match(apiSource, /Sólo puedes mencionar participantes de este caso/, "API should return a clear out-of-scope mention error")
assert.match(apiSource, /La acción sólo puede asignarse a un participante del caso/, "API should return a clear out-of-scope assignee error")

assert.match(migrationSource, /before insert or update of case_id, mentions on public\.case_comments/i, "database must validate comment recipients before persistence")
assert.match(migrationSource, /before insert or update of case_id, assigned_to on public\.case_actions/i, "database must validate action assignees before persistence")
assert.match(migrationSource, /raise exception 'case_recipient_not_member'/, "database must reject recipients outside the case")
assert.match(migrationSource, /exists \([\s\S]*from public\.case_members cm[\s\S]*cm\.user_id = v_uid/, "mention notifications must remain scoped to case members")
assert.match(migrationSource, /cm\.user_id = new\.assigned_to/, "action notifications must remain scoped to case members")

console.log("Case collaboration security regression PASS: API and database recipient scope verified.")
