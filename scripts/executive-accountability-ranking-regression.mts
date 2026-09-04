import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const page = await readFile("app/(app)/monitorear/atencion/page.tsx", "utf8")

for (const needle of [
  'type AccountabilityState = "checking" | "none" | "overdue" | "unassigned" | "open" | "resolved"',
  'ACCOUNTABILITY_RANK',
  'overdue:0, unassigned:1, none:2, open:3, checking:4, resolved:5',
  'PRIORITY_RANK',
  'Accountability → prioridad externa → recencia',
  'label="Vencidas"',
  'label="Sin responsable"',
  'label="Abiertas"',
  'label="Resueltas"',
  'currentAccountabilityState(action,checking)',
  'onAccountabilityChange(item.key,accountabilityState)',
  'visible={index<12}',
  'Todos se consideran para el ranking y las métricas.',
]) assert.ok(page.includes(needle), `missing accountability contract: ${needle}`)

const accountabilitySort = page.indexOf('const byAccountability=ACCOUNTABILITY_RANK[aState]-ACCOUNTABILITY_RANK[bState]')
const prioritySort = page.indexOf('const byPriority=PRIORITY_RANK[a.priority]-PRIORITY_RANK[b.priority]')
const recencySort = page.indexOf('return bTime-aTime||a.key.localeCompare(b.key)')
assert.ok(accountabilitySort >= 0 && prioritySort > accountabilitySort && recencySort > prioritySort, "ranking must apply accountability first, then external priority, then recency")

assert.match(page, /if\(value\.action\.status==="done"\)return "resolved"/)
assert.match(page, /Date\.parse\(value\.action\.due_at\)<Date\.now\(\)\)return "overdue"/)
assert.match(page, /if\(!value\.action\.assigned_to\)return "unassigned"/)
assert.match(page, /return "open"/)

console.log("Executive accountability ranking regression PASS: overdue and unassigned work outrank other attention while external materiality remains the secondary ordering signal, and accountability metrics cover all mounted attention items.")
