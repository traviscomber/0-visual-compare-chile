import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Company watch canonical identity regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}

const [resolver,cmf,procurement]=await Promise.all([
  readFile("lib/intelligence/company-watch-identity.ts","utf8"),
  readFile("lib/intelligence/cmf-company-watch.ts","utf8"),
  readFile("lib/intelligence/mercado-publico-company-watch.ts","utf8"),
])

for(const needle of [
  'canonical_entity_id',
  'matchBasis: "canonical_entity_id" | "exact_normalized_name"',
  '.eq("entity_type", "company")',
  '.eq("normalized_name", normalizedQuery)',
  '.limit(2)',
  'if (!data || data.length !== 1) return null',
])requireText(resolver,needle,"canonical resolver")

for(const [source,label] of [[cmf,"CMF company watch"],[procurement,"Mercado Público company watch"]] as const){
  requireText(source,'resolveCanonicalCompanyWatchIdentity(admin, watch)',label)
  requireText(source,'canonical_entity_id_plus_verified_rut',label)
  requireText(source,'exact_canonical_name_plus_verified_rut',label)
  requireText(source,'canonical_company_id: company.id',label)
  requireText(source,'canonical_company_name: company.canonicalName',label)
  if(source.includes('function normalizeName('))fail(`${label} must not keep a divergent local company normalizer`)
  if(/\.eq\("normalized_name",\s*normalizedQuery\)/.test(source))fail(`${label} must resolve company identity through the shared resolver`)
}

console.log("Company watch canonical identity regression PASS: official company connectors share one fail-closed resolver, prefer explicit canonical entity binding when present, and retain verified-RUT provenance.")
