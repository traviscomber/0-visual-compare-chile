import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Common reports regression FAIL: ${message}`)
  process.exit(1)
}
function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

const [migration, route, page, evaluations] = await Promise.all([
  readFile("supabase/migrations/20260831203705_add_common_intelligence_reports.sql", "utf8"),
  readFile("app/api/intelligence/reports/route.ts", "utf8"),
  readFile("app/(app)/reportes/page.tsx", "utf8"),
  readFile("app/(app)/reportes/evaluaciones/page.tsx", "utf8"),
])

for (const needle of [
  "create table if not exists public.intelligence_reports",
  "vertical in ('brand','patent','technology')",
  "constraint intelligence_reports_series_version_key unique(series_id, version)",
  "alter table public.intelligence_reports enable row level security",
  "revoke all on table public.intelligence_reports from anon",
  "grant select, insert, delete on table public.intelligence_reports to authenticated",
  "create policy intelligence_reports_select",
  "create policy intelligence_reports_insert",
  "create policy intelligence_reports_delete",
  "language plpgsql\nsecurity invoker",
  "pg_advisory_xact_lock",
  "revoke all on function public.create_intelligence_report_snapshot",
]) requireText(migration, needle, "reports migration")

if (/grant\s+[^;]*update[^;]*intelligence_reports/i.test(migration)) fail("reports must remain immutable: authenticated UPDATE grant found")
if (/create policy\s+\S+\s+on public\.intelligence_reports\s+for update/i.test(migration)) fail("reports must remain immutable: UPDATE policy found")

for (const needle of [
  "z.discriminatedUnion(\"vertical\"",
  "buildBrandReport(auth, parsed.data.comparisonId)",
  "buildPatentPriorArtReview",
  "buildTechnologySignals",
  ".eq(\"user_id\", auth.user.id)",
  "create_intelligence_report_snapshot",
  "reportDiff(payload, previous?.source_snapshot",
  "Baseline creado para",
  "p_series_id: parsed.data.seriesId ?? previous?.series_id ?? null",
  "includeGlobal: z.boolean().default(false)",
  "buildPatentReport(parsed.data.query, parsed.data.ipc || null, parsed.data.includeGlobal)",
  "buildPatentPriorArtReview(query, ipc, 30, { includeGlobal })",
  'kind: "patent_family"',
  'source: "EPO OPS"',
  "globalFamilyMatches: item.globalFamilyMatches",
  "priorityClaims: family.priorityClaims",
  "evidenceCoverage: family.evidenceCoverage",
  "globalFamilyLinkedCandidates: review.summary.globalFamilyLinkedCandidates",
  "globalEvidence: {",
  "requested: review.globalEvidence.requested",
  "availability: review.globalEvidence.availability",
  "legalEvents: family.legalEvents",
  "vinculado${review.summary.globalFamilyLinkedCandidates === 1 ? \"\" : \"s\"} por prioridad observada",
  "Candidatos vinculados por prioridad:",
  "Familias EPO observadas:",
]) requireText(route, needle, "reports API")

for (const forbidden of ["createAdminClient", "SUPABASE_SERVICE_ROLE_KEY", "whatChanged: z.", "evidence: z.", "recommendedReview: z."]) {
  if (route.includes(forbidden)) fail(`reports API must derive evidence server-side, forbidden token: ${forbidden}`)
}

for (const needle of [
  "Qué cambió, qué importa y qué revisar ahora.",
  "Último corte por tema",
  "Qué cambió",
  "Qué importa",
  "Evidencia",
  "Revisión sugerida",
  "Próximo monitoreo",
  "El servidor reconstruye el reporte; el navegador no entrega conclusiones libres.",
  '(["brand","patent","technology"] as Vertical[])',
  'href="/reportes/evaluaciones"',
  "includeGlobal",
  "Evidencia internacional EPO OPS",
  "EPO OPS incluido",
  "families, jurisdicciones, citas, eventos jurídicos observados y el estado de cobertura de la fuente",
  "No se infiere estado jurídico actual.",
  "latestBySeries",
  "Último · v",
  "versiones preservadas",
]) requireText(page, needle, "reports UI")

for (const needle of [
  "Historial técnico de comparaciones de marca.",
  "Esta vista conserva las evaluaciones anteriores.",
  "Evaluaciones persistidas",
]) requireText(evaluations, needle, "legacy evaluations surface")

console.log("Common reports regression PASS: Brand/Patent/Technology keep one immutable versioned snapshot model while the UI prioritizes the latest executive cut per topic; authenticated RLS, server-derived evidence, EPO family provenance and preserved historical versions remain intact.")
