import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Assistant competitive research regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [assistant, corroboration, cron, page] = await Promise.all([
  readFile("lib/assistant/videntia-assistant.ts", "utf8"),
  readFile("lib/intelligence/competitive-expansion-corroboration.ts", "utf8"),
  readFile("app/api/cron/trademark-expansion-corroboration/route.ts", "utf8"),
  readFile("app/(app)/asistente/page.tsx", "utf8"),
])

for (const needle of [
  'name: "research_competitive_expansion"',
  'required: ["company", "nice_classes"]',
  'gatherExternalExpansionCorroboration(company, niceClasses, eventDate)',
  'gatherLocalPatentCorroboration(admin, company, niceClasses, eventDate)',
  'classifyEvidenceState(evidence, sourceCoverage)',
  'label: "Corroboración competitiva"',
  'Ausencia o indisponibilidad de evidencia es neutral',
  'decisionBoundary: "Evidence only. Does not mutate conviction, opportunity lifecycle, hypotheses or human decisions."',
  'name: "prepare_action_research"',
  'usa prepare_action_research antes de responder',
  'findTargetContext(context, target)',
  'searchAcademicPapers(researchQuery, sinceYear, maxResults)',
  'label: "Acciones + papers"',
  'currentYear - 5',
  'Academic evidence may support or challenge proposed actions',
]) requireText(assistant, needle, "assistant")

for (const forbidden of [
  '.from("competitive_hypotheses").update',
  '.from("innovation_opportunity_theses").update',
  '.from("trademark_expansion_corroborations").insert',
  '.from("trademark_expansion_corroborations").update',
  '.from("trademark_expansion_corroborations").upsert',
  '.from("case_actions").insert',
  '.from("case_actions").update',
  "conviction_delta",
  "confidence_delta",
  "auto_promote",
]) forbid(assistant, forbidden, "assistant")

for (const needle of [
  'export async function gatherLocalPatentCorroboration',
  '.from("patent_records")',
  'gatherExternalExpansionCorroboration',
  'sourceCoverage',
]) requireText(corroboration, needle, "shared corroboration")

for (const needle of [
  'gatherLocalPatentCorroboration,',
  'gatherLocalPatentCorroboration(admin, company, newNiceClasses, event.event_date)',
]) requireText(cron, needle, "corroboration cron")

for (const forbidden of [
  "async function gatherLocalPatentCorroboration",
  "type PatentRecord =",
]) forbid(cron, forbidden, "corroboration cron")

for (const needle of [
  "Genera acciones para mi oportunidad más relevante y busca papers recientes que las respalden.",
  "fundamenta las acciones propuestas con evidencia académica",
  "Ej: genera acciones para XXX y busca papers recientes que las respalden",
  "Investigando contexto, papers y evidencia…",
]) requireText(page, needle, "assistant page")

console.log("Assistant competitive research regression PASS: the VIDENTIA assistant reuses canonical competitive corroboration, automatically prepares canonical target context plus recent academic papers before proposing actions, preserves source-unavailability neutrality, and remains read-only with respect to canonical actions, hypotheses, opportunities, conviction and human decisions.")
