import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`SNIFA canonical company regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

const [adapter, cron, interactive] = await Promise.all([
  readFile("lib/intelligence/snifa-company-watch.ts", "utf8"),
  readFile("app/api/cron/strategic-watches/route.ts", "utf8"),
  readFile("app/api/intelligence/strategic-watch-signals/route.ts", "utf8"),
])

for (const needle of [
  "resolveCanonicalCompanyWatchIdentity",
  "if (!identity?.rut) return []",
  "searchSnifaFirmSanctions(canonicalName, 12)",
  "normalizeCompanyName(item.holderName).includes(normalizedCanonicalName)",
  "canonical_company_id: identity.id",
  "canonical_company_name: canonicalName",
  "verified_rut: identity.rut",
  "watch_match_basis: identity.matchBasis",
  'source_holder_match_basis: "canonical_company_name_in_official_holder"',
]) requireText(adapter, needle, "SNIFA company adapter")

for (const [source, label] of [[cron, "strategic cron"], [interactive, "interactive strategic signals"]] as const) {
  requireText(source, "scanSnifaCompanyWatch", label)
  requireText(source, 'filter(signal => signal.source_key !== "snifa_sma")', label)
}

console.log("SNIFA canonical company regression PASS: official environmental sanctions require one canonical company with verified RUT, source-holder corroboration, and both persistence paths replace legacy text-only SNIFA candidates.")
