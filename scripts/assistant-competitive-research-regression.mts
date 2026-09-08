import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Assistant competitive research regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [assistant, corroboration, situations, assistantRoute, cron, launcher] = await Promise.all([
  readFile("lib/assistant/videntia-assistant.ts", "utf8"),
  readFile("lib/intelligence/competitive-expansion-corroboration.ts", "utf8"),
  readFile("lib/intelligence/assistant-competitive-situations.ts", "utf8"),
  readFile("app/api/assistant/route.ts", "utf8"),
  readFile("app/api/cron/trademark-expansion-corroboration/route.ts", "utf8"),
  readFile("components/app/videntia-assistant-launcher.tsx", "utf8"),
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
  'export async function loadAssistantCompetitiveSituations',
  'buildExecutiveAttentionQueue(expansionSignals)',
  'buildCompetitiveSituations(situationSignals)',
  '.from("competitive_hypotheses")',
  '.from("competitive_hypothesis_monitoring_events")',
  '.from("trademark_expansion_corroborations")',
  '.eq("user_id", userId)',
  'review_status !== "pending"',
  'assessment === "no_material_change"',
  'Missing or unavailable evidence is neutral.',
]) requireText(situations, needle, "assistant competitive situations")

for (const forbidden of [
  '.insert(',
  '.update(',
  '.upsert(',
  '.delete(',
  'conviction_delta',
  'confidence_delta',
  'auto_promote',
]) forbid(situations, forbidden, "assistant competitive situations")

for (const needle of [
  'loadAssistantCompetitiveSituations(auth.user.id, 6)',
  'needsCompetitiveSituationContext(parsed.data.messages, parsed.data.pageContext)',
  'withCompetitiveSituationContext(assistantMessages, snapshot)',
  'Snapshot canónico interno de Situaciones competitivas VIDENTIA.',
  'señal INAPI observada -> corroboración independiente -> hipótesis aceptada por una persona -> monitoreo posterior -> revisión/acción humana pendiente',
  'Ausencia, indisponibilidad o cobertura parcial de una fuente es neutral',
  'No pidas clases Nice ni IDs si ya están presentes aquí.',
]) requireText(assistantRoute, needle, "assistant route")
for (const forbidden of [
  '.from("competitive_hypotheses").update',
  '.from("competitive_hypothesis_monitoring_events").update',
  'conviction_delta',
  'confidence_delta',
  'auto_promote',
]) forbid(assistantRoute, forbidden, "assistant route")

for (const needle of [
  'gatherLocalPatentCorroboration,',
  'gatherLocalPatentCorroboration(admin, company, newNiceClasses, event.event_date)',
]) requireText(cron, needle, "corroboration cron")

for (const forbidden of [
  "async function gatherLocalPatentCorroboration",
  "type PatentRecord =",
]) forbid(cron, forbidden, "corroboration cron")

for (const needle of [
  "Genera acciones para esta oportunidad y busca papers.",
  "Pantalla actual · contexto · papers · acciones",
  "La pantalla sólo orienta el contexto.",
  "Investigando contexto, papers y evidencia…",
  'fetch("/api/assistant"',
  'role="dialog"',
]) requireText(launcher, needle, "floating assistant")

console.log("Assistant competitive research regression PASS: the page-aware floating assistant receives a read-only canonical competitive-situation snapshot when relevant, reuses the existing attention/situation builders, preserves source-unavailability neutrality and human hypothesis decisions, and keeps evidence-backed action research separate from conviction and canonical writes.")
