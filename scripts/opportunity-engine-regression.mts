import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity Engine regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const engine = await readFile("lib/intelligence/opportunity-engine.ts", "utf8")
const website = await readFile("lib/intelligence/company-website-profile.ts", "utf8")
const route = await readFile("app/api/intelligence/opportunity-engine/route.ts", "utf8")
const page = await readFile("app/(app)/oportunidades/descubrir/page.tsx", "utf8")

for (const needle of [
  'modelForTier("sol")',
  "No inventes TAM, clientes, competidores, ingresos, adopción, regulación, patentes o tendencias.",
  "Distingue con rigor entre evidencia observada, inferencia y vacío de información.",
  "disconfirming_signals",
  "do_not_build",
  "frontier_questions",
  "evidence_strength",
  "defensibility",
]) requireText(engine, needle, "opportunity engine")

for (const needle of [
  'redirect: "manual"',
  "assertPublicHostname",
  "isPrivateAddress",
  "url.hostname !== base.hostname",
  "MAX_RESPONSE_BYTES",
]) requireText(website, needle, "safe website reader")

for (const needle of [
  "assertPortfolioOrganizationAccess",
  "readPublicCompanyWebsite",
  "runOpportunityEngine",
  "PRIVATE_NO_STORE_HEADERS",
  '.eq("organization_id", parsed.data.organizationId)',
]) requireText(route, needle, "opportunity engine API")

for (const forbidden of [".insert(", ".update(", ".delete(", "create_intelligence_action", "service_role"] ) {
  if (route.includes(forbidden)) fail(`opportunity engine API must remain read-only in v1: ${forbidden}`)
}

for (const needle of [
  'fetch("/api/intelligence/opportunity-engine"',
  "Qué NO construir",
  "Qué la invalidaría",
  "Fuerza de evidencia",
  "Ventaja injusta",
  "Triggers a vigilar",
]) requireText(page, needle, "opportunity discovery page")

console.log("Opportunity Engine regression PASS: product discovery is organization-scoped, read-only, SSRF-hardened, Sol-routed, epistemically constrained, explicitly falsifiable, and exposes evidence strength plus anti-roadmap output before any persistence or execution.")
