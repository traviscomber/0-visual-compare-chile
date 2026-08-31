import { readFile } from "node:fs/promises"
import { isPortfolioGap } from "../lib/intelligence/competitive-rules.ts"
import { portfolioGapHref, spaceHref, strategicAnalysisHref, strategicWatchHref } from "../lib/intelligence/navigation-context.ts"

function fail(message: string): never {
  console.error(`Executive flow gates regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const fixture = JSON.parse(await readFile("scripts/fixtures/executive-flow-gates.json", "utf8"))
const bindingRoute = await readFile("app/api/intelligence/portfolio-binding/route.ts", "utf8")
const gapRoute = await readFile("app/api/intelligence/portfolio-gap/route.ts", "utf8")
const gapPage = await readFile("app/(app)/brechas/page.tsx", "utf8")
const watchRoute = await readFile("app/api/intelligence/strategic-watchlist/route.ts", "utf8")
const watchPage = await readFile("app/(app)/monitorear/estrategico/nueva/page.tsx", "utf8")
const technologyPage = await readFile("components/intelligence/technology-signals-workbench.tsx", "utf8")
const dashboard = await readFile("app/(app)/dashboard/page.tsx", "utf8")
const watchMigration = await readFile("supabase/migrations/20260830185516_add_strategic_intelligence_watches.sql", "utf8")
const bindingMigration = await readFile("supabase/migrations/20260830221613_add_ip_space_portfolio_gap_foundation.sql", "utf8")

if (fixture.organization.role !== "admin" || !fixture.organization.slug.startsWith("qa-")) fail("fixture must be isolated and administrator-controlled")
if (fixture.ownIdentity.id === fixture.competitorIdentity.id) fail("fixture identities must be distinct")
if (!isPortfolioGap(fixture.space.ownFilings, fixture.space.competitorFilings)) fail("fixture no longer meets the repeated-gap rule")

for (const needle of ["assertPortfolioOrganizationAccess", "true", "set_intelligence_portfolio_binding", "createAdminClient"]) {
  requireText(bindingRoute, needle, "portfolio binding route")
}
for (const needle of ["assertPortfolioOrganizationAccess", "intelligence_portfolio_bindings", "buildPortfolioGap", "competitorIdentityId"]) {
  requireText(gapRoute, needle, "portfolio gap route")
}
for (const needle of ["competitorIdentityId", "analyzeCompetitor", "portfolioGapHref", "spaceHref"]) {
  requireText(gapPage, needle, "portfolio gap page")
}
for (const needle of ["user_id: auth.user.id", "normalized_query: normalizedQuery", 'error.code === "23505"', "created: false", "created: true"]) {
  requireText(watchRoute, needle, "strategic watch route")
}
for (const needle of ["strategicWatchHref", "Vigilar esta tecnología"]) requireText(technologyPage, needle, "technology CTA")
for (const needle of ["method: \"POST\"", "/api/intelligence/strategic-watchlist", "window.location.assign", "Crear vigilancia"]) {
  requireText(watchPage, needle, "watch confirmation page")
}
for (const needle of ["intelligence_watches", "intelligence_watch_events", "strategicAnalysisHref", 'action:watch?"Abrir análisis"']) {
  requireText(dashboard, needle, "dashboard contextual analysis")
}

for (const needle of ["auth.uid() = user_id", "intelligence_watches_user_type_query_uq", "on delete cascade"]) {
  requireText(watchMigration, needle, "watch ownership schema")
}
for (const needle of ["intelligence_portfolio_bindings_primary_org_idx", "set_intelligence_portfolio_binding", "to service_role"]) {
  requireText(bindingMigration, needle, "portfolio binding schema")
}

const spaceUrl = spaceHref(fixture.space.type, fixture.space.code)
const gapUrl = portfolioGapHref(fixture.competitorIdentity.name, fixture.competitorIdentity.id)
const confirmationUrl = strategicWatchHref(fixture.watch.type, fixture.watch.query)
const analysisUrl = strategicAnalysisHref(fixture.watch.type, fixture.watch.query)

if (spaceUrl !== "/espacios?type=patent&code=H02J3%2F32") fail(`unexpected space deep-link: ${spaceUrl}`)
if (!gapUrl.includes("competitorIdentityId=00000000-0000-4000-8000-000000000202")) fail("gap deep-link lost the competitor identity")
if (!confirmationUrl.startsWith("/monitorear/estrategico/nueva?")) fail("watch confirmation deep-link bypasses explicit confirmation")
if (!analysisUrl.startsWith("/tecnologias?technology=")) fail("dashboard analysis does not return to technology context")

if (/\b(insert|update|delete|create|alter|drop|truncate)\b/i.test(JSON.stringify(fixture))) fail("fixture contains mutation instructions")

console.log("Executive flow gates regression PASS: isolated fixture proves repeated-gap semantics, explicit binding authorization, idempotent watch creation, and dashboard contextual deep-links without touching real organizations.")
