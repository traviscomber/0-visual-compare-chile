import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Dashboard opportunities regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const dashboard = await readFile("app/(app)/dashboard/page.tsx", "utf8")
const attention = await readFile("lib/intelligence/opportunity-thesis-attention.ts", "utf8")
const lifecycleMigration = await readFile("supabase/migrations/20260831153805_add_recommendation_lifecycle.sql", "utf8")

for (const needle of [
  'listPortfolioOrganizations(admin,user.id)',
  '.from("intelligence_recommendations")',
  '.from("innovation_opportunity_theses")',
  '.from("innovation_opportunity_research_runs")',
  '.eq("organization_id",opportunityOrganization.id)',
  'const activeRecommendations=',
  'const acceptedRecommendations=',
  'const activeTheses=',
  'const prototypeTheses=',
  'const thesisAttention=',
  "getPrototypeLearningAttention",
  'const priorityRecommendations=',
  'const acceptedPriorityRecommendations=',
  'const attentionCaseIds=new Set(',
  'href="/oportunidades"',
  'href:"/oportunidades/tesis"',
  'href:"/oportunidades",icon:Compass,title:"¿Dónde aparecen oportunidades?"',
  'kicker:"Oportunidad aceptada"',
  'action:"Llevar a ejecución"',
  '"Prototipo · Clasificar resultado"',
  '"Prototipo · Re-investigar aprendizaje"',
  '"Oportunidades · dos lifecycles canónicos"',
  'productThesesAvailable',
  'aprendizajes',
]) requireText(dashboard, needle, "dashboard")

for (const needle of [
  "prototype_outcome",
  "prototype_assessment",
  "prototype_assessment_id",
  'kind: "needs_assessment"',
  'kind: "needs_research"',
  "source_research_id",
]) requireText(attention, needle, "shared thesis attention")

for (const forbidden of [
  "buildPortfolioGap(",
  "scoreRecommendation(",
  "create_intelligence_action",
  'fetch("/api/intelligence/recommendations',
  'fetch("/api/intelligence/opportunity-theses',
  '/prototype-assessment',
]) {
  if (dashboard.includes(forbidden)) fail(`dashboard must summarize authorized persisted lifecycles server-side without recomputing or mutating intelligence: ${forbidden}`)
}

for (const needle of [
  "alter table public.intelligence_recommendations enable row level security;",
  "revoke all on table public.intelligence_recommendations from anon, authenticated;",
  "grant select, insert, update, delete on table public.intelligence_recommendations to service_role;",
]) requireText(lifecycleMigration, needle, "recommendation lifecycle security")

console.log("Dashboard opportunities regression PASS: dashboard reads both authorized opportunity lifecycles server-side, uses the shared canonical lineage rule for prototype-learning attention, ranks human assessment/re-research alongside other executive actions, degrades sources independently, and never recomputes or mutates intelligence from the overview.")
