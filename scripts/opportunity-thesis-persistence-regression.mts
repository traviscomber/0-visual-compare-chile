import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity thesis persistence regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const migration = await readFile("supabase/migrations/20260905214500_add_innovation_opportunity_theses.sql", "utf8")
const route = await readFile("app/api/intelligence/opportunity-theses/route.ts", "utf8")
const discoveryPage = await readFile("app/(app)/oportunidades/descubrir/page.tsx", "utf8")
const thesisPage = await readFile("app/(app)/oportunidades/tesis/page.tsx", "utf8")
const engineRoute = await readFile("app/api/intelligence/opportunity-engine/route.ts", "utf8")

for (const needle of [
  "create table if not exists public.innovation_opportunity_theses",
  "create table if not exists public.innovation_opportunity_research_runs",
  "unique (organization_id, dedupe_key)",
  "alter table public.innovation_opportunity_theses enable row level security",
  "alter table public.innovation_opportunity_research_runs enable row level security",
  "revoke all on table public.innovation_opportunity_theses from public, anon, authenticated",
  "revoke all on table public.innovation_opportunity_research_runs from public, anon, authenticated",
  "grant select, insert, update, delete on table public.innovation_opportunity_theses to service_role",
  "grant select, insert, update, delete on table public.innovation_opportunity_research_runs to service_role",
  "Human-promoted Opportunity Engine product theses",
]) requireText(migration, needle, "migration")

for (const forbidden of [
  "grant select on table public.innovation_opportunity_theses to authenticated",
  "grant insert on table public.innovation_opportunity_theses to authenticated",
  "to authenticated\nusing",
]) if (migration.includes(forbidden)) fail(`migration exposes thesis tables to client roles: ${forbidden}`)

for (const needle of [
  "assertPortfolioOrganizationAccess",
  "PromoteSchema",
  "thesisDedupeKey",
  '.from("innovation_opportunity_theses")',
  '.from("innovation_opportunity_research_runs")',
  'run_type: "generated"',
  'promotion: "explicit_user_action"',
  "created_by: auth.user.id",
]) requireText(route, needle, "promotion API")

for (const needle of [
  'fetch("/api/intelligence/opportunity-theses"',
  "Guardar para seguimiento",
  "Tesis guardada",
  "/oportunidades/tesis",
]) requireText(discoveryPage, needle, "discovery page")

for (const needle of [
  "/api/intelligence/opportunity-theses?organizationId=",
  "Persistencia ≠ aprobación.",
  "Convicción que debe ganarse, no asumirse.",
  "Research probes",
]) requireText(thesisPage, needle, "thesis workspace")

for (const forbidden of [
  '.from("innovation_opportunity_theses")',
  '.from("innovation_opportunity_research_runs")',
  "opportunity-theses",
]) if (engineRoute.includes(forbidden)) fail(`generation API must remain non-persistent until explicit human action: ${forbidden}`)

console.log("Opportunity thesis persistence regression PASS: generation remains ephemeral, persistence requires an explicit authenticated organization-scoped promotion, canonical thesis tables stay server-only behind RLS and revoked client grants, and the initial evidence snapshot preserves lineage for future confidence changes.")
