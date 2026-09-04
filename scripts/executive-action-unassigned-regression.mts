import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const [page, route, migration] = await Promise.all([
  readFile("app/(app)/monitorear/atencion/page.tsx", "utf8"),
  readFile("app/api/intelligence/actions/route.ts", "utf8"),
  readFile("supabase/migrations/20260904115000_preserve_unassigned_intelligence_actions.sql", "utf8"),
])

assert.match(page, /assignedTo:null/, "executive attention must intentionally create work without inventing an owner")
assert.match(route, /p_assigned_to: assignedTo/, "the API must forward the explicit nullable assignee contract to the canonical RPC")
assert.match(migration, /v_assigned_to := p_assigned_to;/, "the canonical RPC must preserve null as an intentional unassigned state")
assert.doesNotMatch(migration, /coalesce\(p_assigned_to,\s*v_user_id\)/i, "the canonical RPC must not silently self-assign the current user")
assert.match(migration, /trim\(p_action_title\), v_assigned_to, v_user_id, 'open'/, "new actions must persist the nullable assignee while retaining the creator")
assert.match(migration, /case when p_assigned_to is null then assigned_to else v_assigned_to end/, "duplicate-safe reuse must not clear an existing explicit assignee")

console.log("Executive unassigned action regression PASS: null assignee remains a real workflow state and existing assignments are preserved on duplicate-safe reuse.")
