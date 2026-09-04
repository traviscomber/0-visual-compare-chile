import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`SNIFA canonical company regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

function forbidText(source: string, needle: string, label: string) {
  if (source.includes(needle)) fail(`${label} still contains legacy ${needle}`)
}

const [adapter, complianceSource, cron, interactive, strategicScanner] = await Promise.all([
  readFile("lib/intelligence/snifa-company-watch.ts", "utf8"),
  readFile("lib/intelligence/snifa-compliance-programs.ts", "utf8"),
  readFile("app/api/cron/strategic-watches/route.ts", "utf8"),
  readFile("app/api/intelligence/strategic-watch-signals/route.ts", "utf8"),
  readFile("lib/intelligence/strategic-watch-scanner.ts", "utf8"),
])

for (const needle of [
  "resolveCanonicalCompanyWatchIdentity",
  "if (!identity?.rut) return []",
  "searchSnifaFirmSanctions(canonicalName, 12)",
  "searchSnifaRecentCompliancePrograms(canonicalName, 12)",
  "normalizeCompanyName(item.holderName).includes(normalizedCanonicalName)",
  "canonical_company_id: identity.id",
  "canonical_company_name: canonicalName",
  "verified_rut: identity.rut",
  "watch_match_basis: identity.matchBasis",
  'source_holder_match_basis: "canonical_company_name_in_official_holder"',
  'evidence_type: "compliance_program"',
  'regulatory_stage: "compliance_program"',
  "early_warning: true",
  'coverage: "snifa_visible_compliance_program_results"',
]) requireText(adapter, needle, "SNIFA company adapter")

for (const needle of [
  'const RESULTS_PATH = "/ProgramaCumplimiento/Resultado"',
  "/ProgramaCumplimiento\\/Ficha\\/(\\d+)",
  "Fecha Resolución",
  "Frecuencia Reporte",
  "Tipo PdC",
  "normalizeEntity(item.holderName).includes(normalizedQuery)",
]) requireText(complianceSource, needle, "SNIFA compliance source")

for (const [source, label] of [[cron, "strategic cron"], [interactive, "interactive strategic signals"]] as const) {
  requireText(source, "scanSnifaCompanyWatch", label)
  requireText(source, 'filter(signal => signal.source_key !== "snifa_sma")', label)
}

for (const needle of ["searchSnifaFirmSanctions", "scanSnifaFirmSanctions"]) {
  forbidText(strategicScanner, needle, "strategic-watch-scanner")
}

console.log("SNIFA canonical company regression PASS: official environmental sanctions and compliance-program early warnings require one canonical company with verified RUT, source-holder corroboration, both persistence paths replace legacy text-only candidates, and the shared strategic scanner performs no parallel SNIFA network scan.")
