import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const page = await readFile("app/(app)/monitorear/atencion/page.tsx", "utf8")

for (const needle of [
  'type AccountabilityState = "checking" | "none" | "overdue" | "unassigned" | "open" | "resolved"',
  'ACCOUNTABILITY_RANK',
  'PRIORITY_RANK',
  'Accountability → prioridad externa → recencia',
  'label="Para actuar"',
  'label="Abiertas"',
  'label="Críticas"',
  'label="Resueltas"',
  'currentAccountabilityState(action,checking)',
  'onAccountabilityChange(item.key,accountabilityState)',
  'visible={index<12}',
  'Todos se consideran para el ranking y las métricas.',
]) assert.ok(page.includes(needle), `missing accountability contract: ${needle}`)

assert.match(
  page,
  /ACCOUNTABILITY_RANK[^=]*=\s*\{\s*overdue\s*:\s*0\s*,\s*unassigned\s*:\s*1\s*,\s*none\s*:\s*2\s*,\s*open\s*:\s*3\s*,\s*checking\s*:\s*4\s*,\s*resolved\s*:\s*5\s*\}/,
  "accountability rank must remain overdue → unassigned → none → open → checking → resolved",
)

const accountabilitySort = page.indexOf('const byAccountability=ACCOUNTABILITY_RANK[aState]-ACCOUNTABILITY_RANK[bState]')
const prioritySort = page.indexOf('const byPriority=PRIORITY_RANK[a.priority]-PRIORITY_RANK[b.priority]')
const recencySort = page.indexOf('return bTime-aTime||a.key.localeCompare(b.key)')
assert.ok(accountabilitySort >= 0 && prioritySort > accountabilitySort && recencySort > prioritySort, "ranking must apply accountability first, then external priority, then recency")

assert.match(page, /if\(value\.action\.status==="done"\)return "resolved"/)
assert.match(page, /Date\.parse\(value\.action\.due_at\)<Date\.now\(\)\)return "overdue"/)
assert.match(page, /if\(!value\.action\.assigned_to\)return "unassigned"/)
assert.match(page, /return "open"/)

console.log("Executive accountability ranking regression PASS: overdue and unassigned work outrank other attention while external materiality remains the secondary ordering signal, and shared operational metrics cover the mounted attention items.")
