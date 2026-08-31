import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Dashboard opportunities regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const dashboard = await readFile("app/(app)/dashboard/page.tsx", "utf8")
const lifecycleMigration = await readFile("supabase/migrations/20260831153805_add_recommendation_lifecycle.sql", "utf8")

for (const needle of [
  'listPortfolioOrganizations(admin,user.id)',
  '.from("intelligence_recommendations")',
  '.eq("organization_id",opportunityOrganization.id)',
  'label="Oportunidades activas"',
  'href="/oportunidades"',
  'href:"/oportunidades",icon:Compass,title:"¿Dónde aparecen oportunidades?"',
  'priorityRecommendations.slice(0,2)',
  'opportunitiesAvailable?activeRecommendations.length:"—"',
]) requireText(dashboard, needle, "dashboard")

for (const forbidden of [
  "buildPortfolioGap(",
  "scoreRecommendation(",
  "create_intelligence_action",
  'fetch("/api/intelligence/recommendations',
]) {
  if (dashboard.includes(forbidden)) fail(`dashboard must summarize persisted lifecycle without recomputing or client-fetching recommendations: ${forbidden}`)
}

for (const needle of [
  "alter table public.intelligence_recommendations enable row level security;",
  "revoke all on table public.intelligence_recommendations from anon, authenticated;",
  "grant select, insert, update, delete on table public.intelligence_recommendations to service_role;",
]) requireText(lifecycleMigration, needle, "recommendation lifecycle security")

console.log("Dashboard opportunities regression PASS: dashboard reads the authorized persisted recommendation lifecycle server-side, prioritizes actionable opportunities, links to the canonical workspace, and never recomputes intelligence or exposes a client recommendation read path.")
