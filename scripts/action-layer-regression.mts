import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Action layer regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const firstMigration = await readFile("supabase/migrations/20260831015321_create_intelligence_action_bridge.sql", "utf8")
const rlsFixMigration = await readFile("supabase/migrations/20260831015520_fix_intelligence_action_rls_returning.sql", "utf8")
const route = await readFile("app/api/intelligence/actions/route.ts", "utf8")
const inbox = await readFile("app/(app)/casos/pendientes/page.tsx", "utf8")
const strategicWatchConfirmation = await readFile("app/(app)/monitorear/estrategico/nueva/page.tsx", "utf8")

for (const needle of [
  "create_intelligence_action",
  "security invoker",
  "auth.uid()",
  "pg_advisory_xact_lock",
  "public.cases",
  "public.case_items",
  "public.case_actions",
  "revoke all on function",
  "to authenticated",
]) requireText(firstMigration, needle, "action bridge migration")

if (firstMigration.includes("security definer")) fail("action bridge must not bypass RLS with SECURITY DEFINER")

for (const needle of [
  "pg_catalog.gen_random_uuid()",
  "insert into public.cases",
  "insert into public.case_items",
  "insert into public.case_actions",
  "security invoker",
]) requireText(rlsFixMigration, needle, "RLS-safe action bridge fix")

if (/insert into public\.cases[\s\S]*?returning id into v_case_id/i.test(rlsFixMigration)) {
  fail("case creation reintroduced INSERT RETURNING before case read policy can resolve the new row")
}
if (rlsFixMigration.includes("security definer")) fail("RLS fix must preserve SECURITY INVOKER")

for (const needle of [
  "requireUser()",
  "PRIVATE_NO_STORE_HEADERS",
  'rpc("create_intelligence_action"',
  "p_context_type",
  "p_source_id",
  "p_action_title",
  "16_000",
  "created",
  "href: `/casos/${row.case_id}/equipo`",
]) requireText(route, needle, "intelligence action API")

if (route.includes("createAdminClient")) fail("action API must execute as the authenticated user, not service role")
if (!inbox.includes('from("/api/cases/inbox"') && !inbox.includes('fetch("/api/cases/inbox"')) fail("case action inbox is no longer reachable from the pending-work surface")
if (!inbox.includes("Acciones asignadas")) fail("pending-work UI no longer surfaces case actions")

for (const needle of [
  'fetch("/api/intelligence/actions"',
  'method: "POST"',
  'itemType: "watch"',
  'origin: "strategic_watch_confirmation"',
  '"Crear tarea"',
  '>Abrir tarea</Link>',
  '"Crear vigilancia"',
  "Ninguna se ejecuta automáticamente",
  "strategic-watch:",
]) requireText(strategicWatchConfirmation, needle, "strategic watch action CTA")

const createTaskIndex = strategicWatchConfirmation.indexOf("async function createTask")
const actionPostIndex = strategicWatchConfirmation.indexOf('fetch("/api/intelligence/actions"', createTaskIndex)
if (createTaskIndex < 0 || actionPostIndex < createTaskIndex) fail("task mutation is not contained inside the explicit create-task flow")

console.log("Action layer regression PASS: intelligence actions reuse cases/items/actions atomically, preserve RLS, deduplicate repeated open work, surface through the existing case inbox, and expose an explicit task CTA without auto-creating a watch.")
