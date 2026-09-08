import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Juan project documentation research regression FAIL: ${message}`)
  process.exit(1)
}
function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}
function forbid(source: string, needle: string, label: string) {
  if (source.includes(needle)) fail(`${label} must not contain ${needle}`)
}

const [page, serverUi, clientUi, route, cron, vercel] = await Promise.all([
  readFile("app/(app)/mi-espacio/page.tsx", "utf8"),
  readFile("components/app/juan-project-documentation-research.tsx", "utf8"),
  readFile("components/app/juan-project-documentation-research-client.tsx", "utf8"),
  readFile("app/api/intelligence/project-documentation-research/route.ts", "utf8"),
  readFile("app/api/cron/juan-project-rnd-radar/route.ts", "utf8"),
  readFile("vercel.json", "utf8"),
])

for (const needle of [
  'import { JuanProjectDocumentationResearch }',
  '<JuanProjectDocumentationResearch userId={user.id} />',
]) requireText(page, needle, "Juan workspace")

for (const needle of [
  'intelligence_product_evolution_recommendations',
  '.eq("user_id", userId)',
  '.neq("status", "rejected")',
  'evidence_snapshot',
  'normalizeRadar',
  'normalizeDelta',
  'previousGeneratedAt',
  'newSources',
  'JuanProjectDocumentationResearchClient',
]) requireText(serverUi, needle, "project research server UI")

for (const needle of [
  'I+D por proyecto',
  'Qué cambió y qué podemos aplicar',
  '/api/intelligence/project-documentation-research',
  'Proyecto',
  'Qué quieres investigar',
  'documentación oficial',
  'El radar automático compara cada lectura con la anterior.',
  'Radar I+D automático',
  'Primera lectura automática',
  'Qué cambió desde la pasada anterior',
  'Ver lectura completa',
  'conviction Δ 0',
]) requireText(clientUi, needle, "project research client UI")
for (const forbidden of ['dangerouslySetInnerHTML', '.from(', '.insert(', '.update(', '.upsert(', '.delete(']) forbid(clientUi, forbidden, "project research client UI")

for (const needle of [
  'auth.user.email?.trim().toLowerCase() !== JUAN_EMAIL',
  '.eq("user_id", auth.user.id)',
  '.eq("product_key", parsed.data.projectKey)',
  'tools: [{ type: "web_search" }]',
  'documentación oficial de modelos/APIs/frameworks',
  'repositorios oficiales',
  'arXiv/papers',
  'benchmarks reproducibles',
  'No uses actividad GitHub interna ni capacidad N3uralia como evidencia externa.',
  'No cambies score, conviction, estado humano ni decisiones del proyecto.',
  'decisionBoundary',
]) requireText(route, needle, "project documentation research API")
for (const forbidden of [
  '.insert(', '.update(', '.upsert(', '.delete(',
  'conviction_delta', 'confidence_delta', 'auto_promote',
]) forbid(route, forbidden, "project documentation research API")

for (const needle of [
  'request.headers.get("authorization") !== `Bearer ${secret}`',
  'tools: [{ type: "web_search" }]',
  'intelligence_product_evolution_recommendations',
  'previousRadar',
  'summarizeDelta',
  'compareSources',
  'canonicalUrl',
  'new_sources:',
  'previous_generated_at:',
  'source_set_changed:',
  'conviction_delta: 0',
  'No investigues nada adicional y no inventes cambios.',
  'No conviertas novedades técnicas en evidencia de mercado',
  '.update({ evidence_snapshot:',
  'No cambies score, conviction, confidence, estado humano ni lifecycle.',
]) requireText(cron, needle, "project R&D radar cron")
for (const forbidden of [
  '.update({ score:',
  '.update({ status:',
  'decision_at:',
  'decision_note:',
  'confidence_delta:',
  'auto_promote',
]) forbid(cron, forbidden, "project R&D radar cron")

for (const needle of [
  '"path": "/api/cron/juan-project-rnd-radar"',
  '"schedule": "12 */4 * * *"',
]) requireText(vercel, needle, "Vercel cron schedule")

console.log("Juan project documentation research regression PASS")
