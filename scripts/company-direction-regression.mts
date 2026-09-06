import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Company direction regression FAIL: ${message}`)
  process.exit(1)
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

function normalizeCompanyIdentity(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/^\s*\([A-Z]{2}\)\s*/, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")

  return normalized
    .replace(/^(S A C I|SACI|S A I C|SAIC)\s+/, "")
    .replace(/(\s+(S A|SA|S P A|SPA|LTDA|LIMITADA|INC|LLC|LTD|LIMITED|CO LTD|CORP|CORPORATION|GMBH|SAS|N V|NV|AG|PLC|PTE LTD|S A C I|SACI|S A I C|SAIC|S A C I COMERCIANTE))+$/, "")
    .trim()
}

function splitCompanyApplicants(value: string) {
  const prepared = value.replace(/,\s*(\([A-Z]{2}\))/g, "|$1")
  return [...new Set(prepared
    .split(/[;|\n\r]+/)
    .map(item => item.replace(/\s+/g, " ").trim())
    .filter(item => item.length >= 2))]
}

function movements(current: string[][], previous: string[][]) {
  const count = (rows: string[][]) => {
    const map = new Map<string, number>()
    for (const row of rows) {
      for (const code of new Set(row)) map.set(code, (map.get(code) ?? 0) + 1)
    }
    return map
  }
  const a = count(current)
  const b = count(previous)
  return [...new Set([...a.keys(), ...b.keys()])]
    .map(code => ({ code, current: a.get(code) ?? 0, previous: b.get(code) ?? 0, delta: (a.get(code) ?? 0) - (b.get(code) ?? 0) }))
    .sort((x, y) => y.delta - x.delta || y.current - x.current || x.code.localeCompare(y.code))
}

assertEqual("leading SACI", normalizeCompanyIdentity("S.A.C.I. FALABELLA"), "FALABELLA")
assertEqual("trailing SACI", normalizeCompanyIdentity("FALABELLA S.A.C.I."), "FALABELLA")
assertEqual("country + legal suffix", normalizeCompanyIdentity("(US) Apple Inc."), "APPLE")
assertEqual("accent insensitive", normalizeCompanyIdentity("Compañía Minera SpA"), "COMPANIA MINERA")
assertEqual("co ltd suffix", normalizeCompanyIdentity("Huawei Cloud Computing Technologies Co., Ltd."), "HUAWEI CLOUD COMPUTING TECHNOLOGIES")

assertEqual(
  "country-prefixed co-applicants",
  splitCompanyApplicants("(CL) Empresa Uno S.A.,(US) ACME, Inc.;(DE) Beispiel GmbH"),
  ["(CL) Empresa Uno S.A.", "(US) ACME, Inc.", "(DE) Beispiel GmbH"],
)

const movement = movements(
  [["C02F", "B01D"], ["C02F"], ["09"]],
  [["B01D"], ["35"]],
)
assertEqual(
  "new classifications",
  movement.filter(item => item.previous === 0 && item.current > 0).map(item => item.code),
  ["C02F", "09"],
)

const schemaMigration = await readFile("supabase/migrations/20260830210402_add_company_direction_intelligence.sql", "utf8")
const backfillMigration = await readFile("supabase/migrations/20260830210556_backfill_company_ip_activity_12m.sql", "utf8")
const refreshMigration = await readFile("supabase/migrations/20260830211333_refresh_company_ip_activity_from_sync.sql", "utf8")
const dedupeMigration = await readFile("supabase/migrations/20260830211627_dedupe_company_activity_refresh_inputs.sql", "utf8")
const searchDedupeMigration = await readFile("supabase/migrations/20260830211928_dedupe_company_identity_search_results.sql", "utf8")
const searchPerfMigration = await readFile("supabase/migrations/20260830212212_optimize_company_identity_search.sql", "utf8")
const companiesPage = await readFile("app/(app)/empresas/page.tsx", "utf8")

for (const needle of [
  "normalize_company_identity",
  "intelligence_company_identities",
  "intelligence_company_aliases",
  "intelligence_company_ip_activity",
  "search_company_identities",
]) {
  if (!schemaMigration.includes(needle)) fail(`schema migration missing ${needle}`)
}
if (!backfillMigration.includes("split_company_applicants")) fail("backfill does not protect multi-applicant parsing")
if (!refreshMigration.includes("pr.last_synced_at >= p_since")) fail("daily patent refresh is not bounded to current sync")
if (!refreshMigration.includes("tr.last_synced_at >= p_since")) fail("daily trademark refresh is not bounded to current sync")
if (!refreshMigration.includes("current_date - 370")) fail("daily activity refresh is not bounded to the direction horizon")
if (!dedupeMigration.includes("distinct on (m.identity_id, tr.source_record_id)")) fail("trademark refresh can double-upsert the same identity/record")
if (!dedupeMigration.includes("distinct on (m.identity_id, pr.source_record_id)")) fail("patent refresh can double-upsert the same identity/record")
if (!searchDedupeMigration.includes("partition by coalesce(c.country, '*'), c.canonical_core")) fail("legacy company aliases are not collapsed by country + identity")
if (!searchPerfMigration.includes("canonical_identity_key text")) fail("company search lacks persisted canonical identity key")
if (!searchPerfMigration.includes("intelligence_company_identities_canonical_trgm_idx")) fail("company search lacks canonical trigram index")
if (!searchPerfMigration.includes("limit 120")) fail("company search does not shortlist candidates before activity aggregation")

for (const needle of [
  'role="alert" className="mt-6 border border-[#D6A46F]/20 bg-[#332C24]/70 p-4 text-sm text-[#E0B987]"',
  '<OperationalMetricRail className="mt-6 border-t border-border/80">',
  'label="Expedientes / 12m"',
  'detail={`${activity.patents_12m} patentes · ${activity.trademarks_12m} marcas`}',
  'label="Clases distintas"',
  'label="Marcas históricas"',
  'label="Relaciones corporativas verificadas"',
]) {
  if (!companiesPage.includes(needle)) fail(`companies operational UI missing ${needle}`)
}
for (const forbidden of ["#3A2525", "#E8AAA3", "function GraphMetric("]) {
  if (companiesPage.includes(forbidden)) fail(`companies page retains legacy visual pattern: ${forbidden}`)
}

console.log("Company direction regression PASS: identity normalization, co-applicant parsing, six-month classification deltas, sync bounds, duplicate-safe refresh, deduped indexed search, canonical warning treatment, and shared operational graph metrics.")
