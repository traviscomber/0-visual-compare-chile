import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Assistant competitive research regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [assistant, corroboration, cron] = await Promise.all([
  readFile("lib/assistant/videntia-assistant.ts", "utf8"),
  readFile("lib/intelligence/competitive-expansion-corroboration.ts", "utf8"),
  readFile("app/api/cron/trademark-expansion-corroboration/route.ts", "utf8"),
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
]) requireText(assistant, needle, "assistant")

for (const forbidden of [
  '.from("competitive_hypotheses").update',
  '.from("innovation_opportunity_theses").update',
  '.from("trademark_expansion_corroborations").insert',
  '.from("trademark_expansion_corroborations").update',
  '.from("trademark_expansion_corroborations").upsert',
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

console.log("Assistant competitive research regression PASS: the VIDENTIA assistant reuses the canonical Nice-expansion corroboration pipeline across web/news, research and patent evidence; source unavailability remains neutral; and the assistant remains read-only with respect to hypotheses, opportunities, conviction and decisions.")
