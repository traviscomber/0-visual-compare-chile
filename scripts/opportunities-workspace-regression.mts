import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunities workspace regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const page = await readFile("app/(app)/oportunidades/page.tsx", "utf8")
const route = await readFile("app/api/intelligence/recommendations/route.ts", "utf8")

for (const needle of [
  'fetch("/api/intelligence/portfolio-binding"',
  "/api/intelligence/recommendations?organizationId=",
  'filter === "active"',
  'item.status === "converted_to_action"',
  "Buscar nuevas brechas",
  "Revisar decisión",
  "Abrir tarea",
  "Una sola fuente de verdad",
]) requireText(page, needle, "opportunities page")

for (const forbidden of [
  "buildPortfolioGap(",
  "scoreRecommendation(",
  "create_intelligence_action",
]) {
  if (page.includes(forbidden)) fail(`opportunities page must not recompute or auto-create work: ${forbidden}`)
}

for (const needle of [
  '.from("intelligence_company_identities")',
  '.select("id,canonical_name,country")',
  "competitor: identityMap.get",
]) requireText(route, needle, "recommendations listing API")

console.log("Opportunities workspace regression PASS: the executive workspace reads persisted recommendations, preserves lifecycle state, enriches competitor identity server-side, and never recomputes intelligence or auto-creates actions.")
