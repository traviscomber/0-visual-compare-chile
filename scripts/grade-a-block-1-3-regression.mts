import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Grade A block 1-3 regression FAIL: ${message}`)
  process.exit(1)
}
function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

type State = "emerging" | "accelerating" | "persistent" | "declining" | "experimental" | "stable"
function classify(windows: [number, number, number, number]): State {
  const [q0, q1, q2, q3] = windows
  const prior = q1 + q2 + q3
  const total = q0 + prior
  const active = windows.filter(value => value > 0).length
  const average = prior / 3
  if (q0 >= 2 && prior === 0) return "emerging"
  if (q0 === 1 && prior === 0) return "experimental"
  if (q0 >= 2 && prior > 0 && q0 >= q1 + 1 && q0 >= Math.ceil(average * 1.5)) return "accelerating"
  if ((q0 === 0 && (q1 >= 2 || q2 >= 2)) || (q0 > 0 && q1 >= 3 && q0 * 2 <= q1)) return "declining"
  if (active >= 3 && total >= 4) return "persistent"
  return "stable"
}

assertEqual("single filing is experimental", classify([1, 0, 0, 0]), "experimental")
assertEqual("repeated new activity is emerging", classify([2, 0, 0, 0]), "emerging")
assertEqual("recent intensity accelerates", classify([4, 2, 1, 0]), "accelerating")
assertEqual("multi-quarter core persists", classify([1, 1, 1, 1]), "persistent")
assertEqual("recent disappearance declines", classify([0, 3, 1, 0]), "declining")

const trajectoryRules = await readFile("lib/intelligence/company-trajectory-rules.ts", "utf8")
const trajectoryServer = await readFile("lib/intelligence/company-trajectory.ts", "utf8")
const trajectoryRoute = await readFile("app/api/intelligence/company-trajectory/route.ts", "utf8")
const healthRoute = await readFile("app/api/intelligence/health/route.ts", "utf8")
const healthModel = await readFile("lib/intelligence/health.ts", "utf8")
const cronRoute = await readFile("app/api/cron/inapi-open-data/route.ts", "utf8")
const healthSweepRoute = await readFile("app/api/cron/intelligence-health/route.ts", "utf8")
const vercelConfig = await readFile("vercel.json", "utf8")
const ingestionObservability = await readFile("lib/intelligence/ingestion-observability.ts", "utf8")
const retryPolicy = await readFile("lib/intelligence/fetch-with-retry.ts", "utf8")
const companiesPage = await readFile("app/(app)/empresas/page.tsx", "utf8")
const sourcesPage = await readFile("app/(app)/fuentes/page.tsx", "utf8")
const dashboardPage = await readFile("app/(app)/dashboard/page.tsx", "utf8")
const healthMigration = await readFile("supabase/migrations/20260830214913_add_intelligence_health_quality.sql", "utf8")
const graphMigration = await readFile("supabase/migrations/20260830215014_add_company_entity_graph_v2.sql", "utf8")
const graphFixMigration = await readFile("supabase/migrations/20260830215054_fix_company_graph_v2_counts.sql", "utf8")
const bootstrapMigration = await readFile("supabase/migrations/20260830215519_bootstrap_observed_source_health.sql", "utf8")
const catalogHealthMigration = await readFile("supabase/migrations/20260830231309_align_catalog_only_source_health.sql", "utf8")
const healthHistoryMigration = await readFile("supabase/migrations/20260830233236_add_intelligence_health_history_alerts.sql", "utf8")

for (const needle of [
  'q0 >= 2 && prior === 0',
  'q0 === 1 && prior === 0',
  'activeQuarters >= 3 && total >= 4',
  'La trayectoria describe persistencia, aparición y aceleración de protección observada',
]) if (!trajectoryRules.includes(needle)) fail(`trajectory rules missing invariant: ${needle}`)

if (!trajectoryServer.includes('.gte("filing_date", cutoff)')) fail("trajectory query is not bounded to 360 days")
if (!trajectoryServer.includes('get_company_graph_v2')) fail("trajectory does not load entity graph v2")
for (const route of [trajectoryRoute, healthRoute]) {
  if (!route.includes("requireUser()")) fail("intelligence API lacks authenticated boundary")
  if (!route.includes("PRIVATE_NO_STORE_HEADERS")) fail("intelligence API lacks private no-store headers")
}

for (const needle of ["startIntelligenceIngestion", "finishIntelligenceIngestion", "run_intelligence_quality_checks"]) {
  if (!cronRoute.includes(needle)) fail(`INAPI cron not wired to ${needle}`)
}
if (!cronRoute.includes("qualityFailures > 0")) fail("critical quality failures do not affect cron status")
if (!cronRoute.includes('status: "partial"')) fail("cron does not persist partial pipeline outcomes")
if (!cronRoute.includes('ingestionStatus: coreSyncCompleted ? "partial" : "failed"')) fail("cron response does not distinguish partial from failed ingestion")
if (!cronRoute.includes("withSourceRetry")) fail("INAPI cron does not use bounded transient retries")
if (!cronRoute.includes("IntelligenceCircuitOpenError")) fail("INAPI cron does not expose circuit-blocked execution")
const qualityIndex = cronRoute.indexOf('run_intelligence_quality_checks')
const completedIndex = cronRoute.indexOf('status: "completed"')
if (qualityIndex < 0 || completedIndex < 0 || completedIndex < qualityIndex) fail("ingestion is marked completed before quality checks finish")

for (const needle of ["CRON_SECRET", "run_intelligence_health_sweep", 'p_context: "vercel_health_cron"']) {
  if (!healthSweepRoute.includes(needle)) fail(`independent health sweep missing invariant: ${needle}`)
}
if (!vercelConfig.includes('"/api/cron/intelligence-health"') || !vercelConfig.includes('"25 * * * *"')) {
  fail("independent hourly health sweep is not scheduled")
}

const partialBranchStart = ingestionObservability.indexOf('if (status === "partial")')
const completedStateStart = ingestionObservability.indexOf('const { error: stateError }', partialBranchStart)
if (partialBranchStart < 0 || completedStateStart < 0) fail("partial ingestion health branch is missing")
const partialBranch = ingestionObservability.slice(partialBranchStart, completedStateStart)
if (partialBranch.includes("last_success_at")) fail("partial ingestion incorrectly advances last_success_at")
if (!partialBranch.includes("last_attempt_at")) fail("partial ingestion does not preserve last attempt evidence")
if (!partialBranch.includes("last_error")) fail("partial ingestion does not degrade source health")
for (const needle of ["blockedByCircuit", 'circuit_state: circuitIsOpen ? "half_open"', "circuit_open_until"]) {
  if (!ingestionObservability.includes(needle)) fail(`circuit breaker missing invariant: ${needle}`)
}
for (const needle of ["withSourceRetry", "isTransientSourceError", "attempts", "baseDelayMs"]) {
  if (!retryPolicy.includes(needle)) fail(`retry policy missing invariant: ${needle}`)
}

if (!healthModel.includes('diaria: 36')) fail("daily source SLA is not explicit")
if (!healthModel.includes('semanal: 24 * 9')) fail("weekly source SLA is not explicit")
if (!sourcesPage.includes("Saber qué fuente está fresca antes de decidir")) fail("source health workspace missing trust narrative")
if (!sourcesPage.includes("Bitácora de corridas y reconciliación")) fail("source health workspace missing ingestion history")
if (!companiesPage.includes("Hacia dónde se está moviendo la protección")) fail("company UI missing trajectory surface")
if (!companiesPage.includes("Relaciones corporativas verificadas")) fail("company UI missing graph v2 surface")

for (const question of [
  "¿Qué cambió esta semana?",
  "¿Qué está protegiendo ahora que hace seis meses no protegía?",
  "¿Dónde está llevando su tecnología?",
  "¿Quién está entrando en mi espacio?",
  "¿Qué tecnologías están acelerándose?",
  "¿Dónde aparecen oportunidades?",
]) if (!dashboardPage.includes(question)) fail(`dashboard missing executive question: ${question}`)
for (const href of ["/monitorear/estrategico", "/empresas", "/espacios", "/tecnologias", "/brechas"]) {
  if (!dashboardPage.includes(`href:\"${href}\"`) && !dashboardPage.includes(`href=\"${href}\"`)) fail(`dashboard missing executive route ${href}`)
}
if (!dashboardPage.includes('from("intelligence_watches")') || !dashboardPage.includes('from("intelligence_watch_events")')) fail("dashboard executive layer is not grounded in the user strategic watch state")

for (const needle of [
  "intelligence_quality_runs",
  "intelligence_quality_results",
  "source_event_traceability",
  "strategic_change_multi_evidence",
  "company_activity_identity_integrity",
]) if (!healthMigration.includes(needle)) fail(`health migration missing ${needle}`)

for (const needle of ["intelligence_company_entity_links", "intelligence_company_relationships", "legacy_exact_name", "get_company_graph_v2"]) {
  if (!graphMigration.includes(needle)) fail(`graph migration missing ${needle}`)
}
if (!graphMigration.includes("parent_of") || !graphMigration.includes("subsidiary_of")) fail("corporate graph lacks explicit relation semantics")
if (!graphFixMigration.includes("marks_all") || !graphFixMigration.includes("classifications as")) fail("graph count multiplication regression is unprotected")
if (!bootstrapMigration.includes("max(last_synced_at)") || !bootstrapMigration.includes("source_key='tdpi'")) fail("source health bootstrap is not evidence-based")
for (const sourceKey of ["registro_empresas", "superir", "wipo_lex_cl"]) {
  if (!catalogHealthMigration.includes(sourceKey)) fail(`catalog-only health migration missing ${sourceKey}`)
}
if (!catalogHealthMigration.includes("is_active = false")) fail("catalog-only sources are still presented as operational")
for (const needle of [
  "intelligence_source_health_history",
  "intelligence_source_alerts",
  "source_health_alert",
  "source_health_resolved",
  "run_intelligence_health_sweep",
  "grant execute on function public.run_intelligence_health_sweep(text) to service_role",
]) if (!healthHistoryMigration.includes(needle)) fail(`health history migration missing ${needle}`)
if (!healthHistoryMigration.includes("revoke all on public.intelligence_source_health_history from public, anon, authenticated")) fail("health history table is exposed to client roles")
if (!healthHistoryMigration.includes("revoke all on public.intelligence_source_alerts from public, anon, authenticated")) fail("source alerts table is exposed to client roles")

console.log("Grade A block 1-3 regression PASS: health/quality wiring, partial-success lifecycle, independent SLA sweep, retry/circuit policy, curated identity quality gate, executive six-question entry, entity graph and trajectory guardrails.")
