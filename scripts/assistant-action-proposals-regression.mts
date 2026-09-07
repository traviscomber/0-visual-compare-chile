import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Assistant action proposals regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [assistant, page, route] = await Promise.all([
  readFile("lib/assistant/videntia-assistant.ts", "utf8"),
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
  'async function createAction',
  'fetch("/api/intelligence/actions"',
  'method: "POST"',
  '"Crear acción"',
  'actionProposals',
  'requieren aprobación',
  'humanApprovalRequired',
  'Sólo se crea la acción que confirmes.',
  'Sin soporte académico suficiente. Esto no se interpreta como evidencia negativa.',
]) requireText(page, needle, "assistant page")

const createActionIndex = page.indexOf("async function createAction")
const actionPostIndex = page.indexOf('fetch("/api/intelligence/actions"', createActionIndex)
const actionClickIndex = page.indexOf('onClick={() => void createAction(message.id, proposal)}')
if (createActionIndex < 0 || actionPostIndex < createActionIndex || actionClickIndex < 0) {
  fail("canonical action mutation is not contained inside the explicit user create-action flow")
}

for (const needle of [
  "requireUser()",
  'rpc("create_intelligence_action"',
  "p_evidence: evidence",
  "PRIVATE_NO_STORE_HEADERS",
]) requireText(route, needle, "canonical action API")
if (route.includes("createAdminClient")) fail("canonical action API must remain authenticated-user/RLS scoped")

console.log("Assistant action proposals regression PASS: VIDENTIA structures evidence-backed action proposals without writing canonical data, validates paper references against retrieved research, and creates a case action only after an explicit user click through the existing authenticated RLS action bridge.")
