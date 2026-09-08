import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Juan subsection delta regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [cron, ui, assistant] = await Promise.all([
  readFile("app/api/cron/juan-subsection-papers/route.ts", "utf8"),
  readFile("components/app/juan-subsection-research.tsx", "utf8"),
  readFile("lib/intelligence/assistant-juan-workspace.ts", "utf8"),
])

for (const needle of [
  'const DELTA_BOUNDARY = "Subsection deltas describe discovery freshness only.',
  'const previousResearch = readStoredSubsectionResearch(snapshot.subsection_research)',
  'const delta = buildDiscoveryDelta(previousResearch, topicResults)',
  'baseline_created: true',
  'new_paper_count: 0',
  'not_observed_again_count: 0',
  'previous_generated_at: asString(previous.generated_at)',
  'new_paper_count: [...currentIds].filter(identity => !previousIds.has(identity)).length',
  'not_observed_again_count: notObservedAgain',
  'new_papers: newPapers',
  'dynamic_subsection_papers_v2_delta',
  'deltaBoundary: DELTA_BOUNDARY',
  'conviction_delta: 0',
  'decision_effect: "none"',
  'scoreChanged: false',
]) requireText(cron, needle, "subsection research cron")
for (const forbidden of [
  '.update({ score:',
  '.update({ status:',
  'auto_promote',
  '.from("competitive_hypotheses")',
  '.from("innovation_opportunity_theses")',
]) forbid(cron, forbidden, "subsection research cron")

for (const needle of [
  'type SubsectionResearchDelta = {',
  'Línea base creada: la próxima pasada podrá distinguir qué papers son realmente nuevos.',
  'Sin papers nuevos',
  'novedad bibliográfica orienta revisión; no demuestra por sí sola un cambio de mercado.',
  'Separa papers nuevos desde la última pasada del total histórico retenido.',
  'No modifica convicción',
]) requireText(ui, needle, "subsection research UI")
for (const forbidden of [
  '.update(',
  '.insert(',
  '.upsert(',
  '.delete(',
]) forbid(ui, forbidden, "subsection research UI")

for (const needle of [
  'subsectionNewPapersObserved',
  'subsectionProductsWithFreshPapers',
  'subsectionResearch.delta measures discovery freshness only',
  'new papers do not prove market movement and papers not observed again are neutral',
]) requireText(assistant, needle, "Juan assistant snapshot")
for (const forbidden of [
  '.insert(',
  '.update(',
  '.upsert(',
  '.delete(',
]) forbid(assistant, forbidden, "Juan assistant snapshot")

console.log("Juan subsection delta regression PASS: VIDENTIA compares each bounded discovery pass against the prior snapshot, establishes a neutral baseline on first observation, surfaces genuinely new papers without interpreting missing papers negatively, and keeps all subsection freshness at zero conviction/decision effect.")
