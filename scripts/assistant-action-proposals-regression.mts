import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Assistant action proposals regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [assistant, launcher, page, route] = await Promise.all([
  readFile("lib/assistant/videntia-assistant.ts", "utf8"),
  readFile("components/app/videntia-assistant-launcher.tsx", "utf8"),
  readFile("app/(app)/asistente/page.tsx", "utf8"),
  readFile("app/api/intelligence/actions/route.ts", "utf8"),
])

for (const needle of [
  'name: "propose_action_candidates"',
  'state.actionResearch.set(actionResearchKey(target), data)',
  'normalizeActionProposals',
  'paper_ids',
  'papersById.get(paperId)',
  'humanApprovalRequired: true',
  'actionRequest',
  'origin: "videntia_assistant_proposal"',
  'recommendationConfidence: confidence',
  '"insufficient_academic_evidence"',
  '`opportunity:${id}`',
  '`competitive_hypothesis:${id}`',
  'La creación de una acción sólo ocurre si el usuario presiona explícitamente “Crear acción”.',
]) requireText(assistant, needle, "assistant")

for (const forbidden of [
  '.from("case_actions").insert',
  '.from("case_items").insert',
  'rpc("create_intelligence_action"',
  '.from("cases").insert',
]) forbid(assistant, forbidden, "assistant")

for (const needle of [
  '"use client"',
  'const [open, setOpen] = useState(false)',
  'aria-label="Abrir Asistente VIDENTIA"',
  'role="dialog"',
  'aria-modal="false"',
  'fixed inset-x-2 bottom-2 top-[72px]',
  'md:w-[min(440px,calc(100vw-40px))]',
  'params.get("assistant") === "open"',
  'async function createAction',
  'fetch("/api/intelligence/actions"',
  'method: "POST"',
  '"Crear acción"',
  'actionProposals',
  'requieren aprobación',
  'humanApprovalRequired',
  'Sin soporte académico suficiente; no se interpreta como evidencia negativa.',
]) requireText(launcher, needle, "floating assistant")

for (const forbidden of [
  'href="/asistente"',
  'hidden items-center',
]) forbid(launcher, forbidden, "floating assistant")

const createActionIndex = launcher.indexOf("async function createAction")
const actionPostIndex = launcher.indexOf('fetch("/api/intelligence/actions"', createActionIndex)
const actionClickIndex = launcher.indexOf('onClick={() => void createAction(message.id, proposal)}')
if (createActionIndex < 0 || actionPostIndex < createActionIndex || actionClickIndex < 0) {
  fail("canonical action mutation is not contained inside the explicit user create-action flow")
}

for (const needle of [
  'redirect("/dashboard?assistant=open")',
]) requireText(page, needle, "assistant compatibility route")
for (const forbidden of [
  "OperationalPage",
  "async function createAction",
]) forbid(page, forbidden, "assistant compatibility route")

for (const needle of [
  "requireUser()",
  'rpc("create_intelligence_action"',
  "p_evidence: evidence",
  "PRIVATE_NO_STORE_HEADERS",
]) requireText(route, needle, "canonical action API")
if (route.includes("createAdminClient")) fail("canonical action API must remain authenticated-user/RLS scoped")

console.log("Assistant action proposals regression PASS: VIDENTIA keeps the assistant as a persistent floating chat, preserves evidence-backed proposals, and creates a canonical case action only after an explicit user click through the authenticated RLS action bridge.")
