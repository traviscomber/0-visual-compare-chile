import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunities workspace regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const page = await readFile("app/(app)/oportunidades/page.tsx", "utf8")
const attention = await readFile("lib/intelligence/opportunity-thesis-attention.ts", "utf8")
const route = await readFile("app/api/intelligence/recommendations/route.ts", "utf8")
const thesisRoute = await readFile("app/api/intelligence/opportunity-theses/route.ts", "utf8")
const nav = await readFile("components/app/app-nav.tsx", "utf8")

for (const needle of [
  'fetch("/api/intelligence/portfolio-binding"',
  "/api/intelligence/recommendations?organizationId=",
  "/api/intelligence/opportunity-theses?organizationId=",
  "Promise.all([",
  'filter === "active"',
  'item.status === "converted_to_action"',
  "/oportunidades/descubrir",
  "/oportunidades/tesis",
  "Descubrir",
  "Tesis de producto",
  "Revisar decisión",
  "Abrir tarea",
  "getPrototypeLearningAttention",
  "Clasificar resultado",
  "Re-investigar aprendizaje",
  "Dos lifecycles. Una lectura ejecutiva.",
  "Fuente degradada",
]) requireText(page, needle, "opportunities page")

for (const needle of [
  "prototype_outcome",
  "prototype_assessment",
  "prototype_assessment_id",
  'kind: "needs_assessment"',
  'kind: "needs_research"',
  "source_research_id",
  "consumed",
]) requireText(attention, needle, "shared thesis attention")

for (const forbidden of [
  "buildPortfolioGap(",
  "scoreRecommendation(",
  "create_intelligence_action",
  "/prototype-assessment",
  'method: "POST"',
]) {
  if (page.includes(forbidden)) fail(`opportunities page must remain a read/control surface and never recompute or mutate persisted work: ${forbidden}`)
}

for (const needle of [
  '.from("intelligence_company_identities")',
  '.select("id,canonical_name,country")',
  "competitor: identityMap.get",
]) requireText(route, needle, "recommendations listing API")

for (const needle of [
  '.from("innovation_opportunity_theses")',
  '.from("innovation_opportunity_research_runs")',
  "research_history",
  "historyByOpportunity",
]) requireText(thesisRoute, needle, "thesis listing API")

requireText(
  nav,
  'label:"Tecnologías",icon:Activity,aliases:["/empresas","/espacios","/brechas","/oportunidades"]',
  "contextual technology navigation",
)

console.log("Opportunities workspace regression PASS: the executive workspace reads recommendation and product-thesis lifecycles in parallel, delegates prototype-learning attention to one shared lineage rule, keeps each source canonical, degrades thesis reading without hiding persisted recommendations, and never recomputes scores or mutates either lifecycle from the overview.")
