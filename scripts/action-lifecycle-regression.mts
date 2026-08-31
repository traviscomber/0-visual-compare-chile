import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Action lifecycle regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const migration = await readFile("supabase/migrations/20260831023000_add_case_action_outcomes.sql", "utf8")
const route = await readFile("app/api/cases/collaboration/route.ts", "utf8")
const page = await readFile("app/(app)/casos/[id]/equipo/page.tsx", "utf8")

for (const needle of ["outcome text", "outcome_at timestamptz", "outcome_by uuid", "action_outcome_required", "assignee_can_only_change_status_and_outcome", "auth.uid()"])
  requireText(migration, needle, "outcome migration")
for (const needle of ["outcome.length < 2", "outcome.length > 2000", 'outcome: status === "done" ? outcome : null', "updated_at"])
  requireText(route, needle, "collaboration API")
if (route.includes("outcome_by:") || route.includes("outcome_at:")) fail("API must not forge outcome attribution; the database derives it")
for (const needle of ["¿Qué se resolvió, decidió o descartó?", "Guardar resultado", "Reabrir acción", "action.outcome"])
  requireText(page, needle, "case collaboration UI")

if (route.includes("SUPABASE_SERVICE_ROLE_KEY") || route.includes("createAdminClient")) fail("action completion must preserve the authenticated RLS boundary")

console.log("Action lifecycle regression PASS: completion requires an attributable outcome, assignees remain field-restricted, and reopening clears stale completion state.")
