import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const migration = await readFile("supabase/migrations/20260904120500_add_executive_critical_escalation.sql", "utf8")

assert.match(migration, /jsonb_build_object\('linked_action_id', v_action_id::text\)/, "executive evidence must retain an exact action id for automation joins")
assert.match(migration, /ci\.metadata->>'origin' = 'executive_attention'/, "critical escalation must be scoped to executive-attention evidence")
assert.match(migration, /ci\.metadata->>'attentionPriority' = 'critica'/, "unassigned escalation must be restricted to critical executive attention")
assert.match(migration, /ci\.metadata->>'linked_action_id' = a\.id::text/, "automation must join the exact linked action rather than infer by title or case")
assert.match(migration, /a\.assigned_to is null/, "unassigned critical actions must be detectable")
assert.match(migration, /'executive_unassigned_escalation'/, "unassigned critical escalation must use its own dedupe action type")
assert.match(migration, /coalesce\(v_critical_action\.due_at, v_critical_action\.created_at\)/, "dedupe must use a stable non-null snapshot")
assert.match(migration, /on conflict do nothing\s+returning id into v_action_log_id;/, "critical escalation must be duplicate-safe before notifications are emitted")
assert.match(migration, /'Acción crítica sin responsable'/, "case owner must receive a clear escalation notification")
assert.match(migration, /'executiveUnassignedEscalations',v_executive_unassigned_escalations/, "automation sweep must expose the new escalation count")

// Assigned overdue work remains covered by the established deadline automation path.
assert.match(migration, /'action_overdue_escalation'/, "overdue actions must continue through the existing controlled escalation path")
assert.match(migration, /if v_action\.owner_id <> v_action\.assigned_to then/, "overdue assigned actions must continue escalating to the case owner")

console.log("Executive critical escalation regression PASS: exact critical actions escalate once when unassigned while existing overdue escalation remains intact.")
