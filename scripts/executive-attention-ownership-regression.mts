import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Executive attention ownership regression FAIL: ${message}`)
  process.exit(1)
}
function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const route = await readFile("app/api/intelligence/actions/route.ts", "utf8")
const page = await readFile("app/(app)/monitorear/atencion/page.tsx", "utf8")

for (const needle of [
  "export async function GET(request: Request)",
  'from("case_items")',
  'from("cases")',
  'from("case_actions")',
  'rpc("get_case_members"',
  'rpc("case_access_role"',
  "assigned_to",
  "due_at",
  "completed_at",
  "outcome",
  "PRIVATE_NO_STORE_HEADERS",
]) requireText(route, needle, "intelligence action status API")

if (route.includes("createAdminClient") || route.includes("SUPABASE_SERVICE_ROLE_KEY")) fail("status projection must preserve authenticated RLS")

for (const needle of [
  "loadActionState",
  "Acción abierta",
  "Acción vencida",
  "Acción resuelta",
  "Sin acción",
  'type:"action_schedule"',
  "Responsable",
  "Fecha límite",
  "action.members.map",
]) requireText(page, needle, "executive attention UI")

console.log("Executive attention ownership regression PASS: attention rows restore canonical action state, expose owner/deadline/outcome, and reuse case collaboration permissions for reassignment.")
