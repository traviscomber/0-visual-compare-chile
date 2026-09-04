import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const [route, page] = await Promise.all([
  readFile("app/api/intelligence/actions/route.ts", "utf8"),
  readFile("app/(app)/monitorear/atencion/page.tsx", "utf8"),
])

assert.match(route, /from\("case_automation_actions"\)/, "linked action API must read the canonical automation ledger")
assert.match(route, /\.eq\("case_action_id", action\.id\)/, "escalation lookup must bind to the exact linked action id")
assert.match(route, /\.eq\("action_type", "executive_unassigned_escalation"\)/, "only the controlled critical-unassigned escalation may be projected")
assert.match(route, /type: "owner_unassigned_critical" as const/, "API must expose a stable typed escalation state")
assert.match(route, /createdAt: escalationRow\.created_at/, "API must expose when the escalation happened")

assert.match(page, /escalation:\{ type:"owner_unassigned_critical"; createdAt:string \}\|null/, "attention UI must model escalation history explicitly")
assert.match(page, /Escalada al owner/, "attention UI must make owner escalation visible")
assert.match(page, /formatDate\(action\.escalation\.createdAt\)/, "attention UI must show the escalation timestamp")
assert.match(page, /Responsable · \{assignee\?\.display_name\|\|"Sin responsable"\}/, "escalation history must not replace current ownership state")

console.log("Executive escalation visibility regression PASS: exact ledger-backed escalation state and timestamp remain visible without replacing live action accountability.")
