import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Action SLA regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const route = await readFile("app/api/cases/collaboration/route.ts", "utf8")
const teamPage = await readFile("app/(app)/casos/[id]/equipo/page.tsx", "utf8")
const inboxPage = await readFile("app/(app)/casos/pendientes/page.tsx", "utf8")
const recipientMigration = await readFile("supabase/migrations/20260830030000_harden_case_collaboration_recipients.sql", "utf8")
const outcomeMigration = await readFile("supabase/migrations/20260831023000_add_case_action_outcomes.sql", "utf8")

for (const needle of [
  'body.type === "action_schedule"',
  'const EDIT_ROLES = new Set(["owner", "editor"])',
  'rpc("case_access_role"',
  'action.status !== "open"',
  '.from("case_members").select("user_id").eq("case_id", action.case_id).eq("user_id", assignedTo).maybeSingle()',
  'assigned_to: assignedTo',
  'due_at: dueAt',
  'Sólo responsables y editores pueden reasignar o cambiar la fecha.',
]) requireText(route, needle, "collaboration API")

if (route.includes("createAdminClient") || route.includes("SUPABASE_SERVICE_ROLE_KEY")) {
  fail("action scheduling must stay behind authenticated RLS, never service role")
}

for (const needle of [
  'type:"action_schedule"',
  "Responsable de",
  "Fecha límite de",
  'label:"Vencida"',
  'label:"Próxima · 48 h"',
  "Reabre la acción",
]) requireText(teamPage, needle, "team action UI")

for (const needle of [
  "Registrar resultado",
  'status:"done",outcome',
  "Resultado requerido",
  'label="Vencidas"',
  'label="Próximas 48 h"',
  "outcome.trim().length<2",
  'kind:"overdue"',
  'kind:"soon"',
]) requireText(inboxPage, needle, "action inbox")

if (inboxPage.includes('body:JSON.stringify({type:"action",id,status:"done"})')) {
  fail("inbox must not complete an action without an attributable outcome")
}

for (const needle of [
  "before insert or update of case_id, assigned_to on public.case_actions",
  "case_recipient_not_member",
]) requireText(recipientMigration, needle, "recipient scope migration")

for (const needle of [
  "action_outcome_required",
  "assignee_can_only_change_status_and_outcome",
]) requireText(outcomeMigration, needle, "outcome migration")

console.log("Action SLA regression PASS: owner/editor scheduling remains membership-scoped and RLS-bound, overdue/48h states are visible, and inbox completion requires an attributable outcome.")
