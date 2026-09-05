import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity prototype execution regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

const helper = await readFile("lib/intelligence/opportunity-prototype-execution.ts", "utf8")
const route = await readFile("app/api/intelligence/opportunity-theses/[id]/decision/route.ts", "utf8")

for (const needle of [
  'client.rpc("create_intelligence_action"',
  'p_context_type: "general"',
  'p_item_type: "research"',
  'const sourceId = `opportunity:${input.opportunityId}`',
  'const actionTitle = "Definir experimento de prototipo"',
  'p_priority: "normal"',
  'p_due_at: null',
  'p_assigned_to: input.decisionMakerUserId',
  'human_review_id: input.humanReviewId',
  'execution_policy: "explicit_human_prototype_approval"',
  'href: `/casos/${row.case_id}/equipo`',
]) requireText(helper, needle, "prototype execution helper")

for (const forbidden of [
  'p_priority: "high"',
  'p_due_at: new Date',
  'scheduled_research',
  'live_research',
]) if (helper.includes(forbidden)) fail(`prototype execution must not invent urgency or be AI-triggered: ${forbidden}`)

for (const needle of [
  'parsed.data.target === "prototype"',
  'ensureOpportunityPrototypeExecution(auth.supabase',
  'humanReviewId: String(audit.id)',
  'decisionMakerUserId: auth.user.id',
  'console.error("[opportunity-theses:decision:prototype-execution]"',
  'execution,',
]) requireText(route, needle, "decision route")

const auditInsert = route.indexOf('.from("innovation_opportunity_research_runs")')
const executionCall = route.indexOf("ensureOpportunityPrototypeExecution(auth.supabase")
const executionCatch = route.indexOf('console.error("[opportunity-theses:decision:prototype-execution]"')
const response = route.indexOf("execution,", executionCatch)
if (!(auditInsert >= 0 && executionCall > auditInsert && executionCatch > executionCall && response > executionCatch)) {
  fail("prototype execution must occur after immutable human-review persistence and remain best-effort")
}

if (route.includes('parsed.data.target === "watching"') && route.includes("ensureOpportunityPrototypeExecution", route.indexOf('parsed.data.target === "watching"'))) {
  fail("watching must never create prototype execution")
}

console.log("Opportunity prototype execution regression PASS: only explicit admin prototype approval bridges into the existing accountable case/action layer, the decision maker becomes the initial assignee, no deadline or high urgency is invented, exact opportunity evidence is preserved, and execution delivery failure never rolls back the audited human decision.")
