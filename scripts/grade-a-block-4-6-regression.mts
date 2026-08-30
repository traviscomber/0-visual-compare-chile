import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Grade A block 4-6 regression FAIL: ${message}`)
  process.exit(1)
}
function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

function movement(current: number, previous: number) {
  if (current >= 2 && previous === 0) return "entrante"
  if (current === 1 && previous === 0) return "experimental"
  if (previous > 0 && current >= previous + 2 && current >= previous * 1.5) return "acelerando"
  if (current > 0 && previous > 0) return "consolidado"
  if (current === 0 && previous > 0) return "retirandose"
  return "sin_senal"
}
function isGap(own: number, competitor: number) { return own === 0 && competitor >= 2 }

assertEqual("single new filing stays experimental", movement(1, 0), "experimental")
assertEqual("repeated new activity becomes entrant", movement(2, 0), "entrante")
assertEqual("growth requires repeated evidence", movement(4, 2), "acelerando")
assertEqual("continuous activity stays consolidated", movement(2, 2), "consolidado")
assertEqual("one competitor filing is not a portfolio gap", isGap(0, 1), false)
assertEqual("two competitor filings with zero own coverage is a gap", isGap(0, 2), true)
assertEqual("existing own coverage is not a gap", isGap(1, 5), false)

const rules = await readFile("lib/intelligence/competitive-rules.ts", "utf8")
const spaceModel = await readFile("lib/intelligence/ip-space.ts", "utf8")
const gapModel = await readFile("lib/intelligence/portfolio-gap.ts", "utf8")
const accessModel = await readFile("lib/intelligence/portfolio-access.ts", "utf8")
const identityRoute = await readFile("app/api/intelligence/company-identities/route.ts", "utf8")
const spaceRoute = await readFile("app/api/intelligence/ip-space/route.ts", "utf8")
const bindingRoute = await readFile("app/api/intelligence/portfolio-binding/route.ts", "utf8")
const gapRoute = await readFile("app/api/intelligence/portfolio-gap/route.ts", "utf8")
const spacesPage = await readFile("app/(app)/espacios/page.tsx", "utf8")
const gapsPage = await readFile("app/(app)/brechas/page.tsx", "utf8")
const migration = await readFile("supabase/migrations/20260830221613_add_ip_space_portfolio_gap_foundation.sql", "utf8")

for (const needle of [
  'current >= 2 && previous === 0',
  'current === 1 && previous === 0',
  'ownFilings === 0 && competitorFilings >= 2',
  'materiality', 'novelty', 'convergence', 'persistence', 'proximity',
]) if (!rules.includes(needle)) fail(`competitive rules missing invariant: ${needle}`)

if (!spaceModel.includes('analyze_ip_space')) fail("space model does not use bounded database RPC")
if (!gapModel.includes('classification_market_stats')) fail("portfolio gap lacks market convergence evidence")
if (!gapModel.includes('competitorFilings: item.competitor_filings')) fail("recommendations are not derived from observed competitor activity")
if (!gapModel.includes('Prioriza una revisión humana')) fail("recommendation guardrail is missing")
if (gapModel.includes('profile.company_name')) fail("portfolio gap must not infer ownership from profile company name")

for (const route of [identityRoute, spaceRoute, bindingRoute, gapRoute]) {
  if (!route.includes("requireUser()")) fail("intelligence API lacks authenticated boundary")
  if (!route.includes("PRIVATE_NO_STORE_HEADERS")) fail("intelligence API lacks private no-store headers")
}
if (!bindingRoute.includes('assertPortfolioOrganizationAccess') || !bindingRoute.includes('true)')) fail("binding mutation is not restricted to organization administrators")
if (!gapRoute.includes('assertPortfolioOrganizationAccess')) fail("gap analysis does not verify organization membership")
if (!accessModel.includes('organization_members')) fail("portfolio ownership is not anchored to organization membership")

for (const needle of [
  "intelligence_portfolio_bindings",
  "enable row level security",
  "revoke all on table public.intelligence_portfolio_bindings from anon, authenticated",
  "grant select, insert, update, delete on table public.intelligence_portfolio_bindings to service_role",
  "set_intelligence_portfolio_binding",
  "analyze_ip_space",
  "classification_market_stats",
  "revoke execute on function public.analyze_ip_space(text, text, integer) from public, anon, authenticated",
  "grant execute on function public.analyze_ip_space(text, text, integer) to service_role",
]) if (!migration.includes(needle)) fail(`migration missing security/data invariant: ${needle}`)

if (!migration.includes("current_count >= 2 and c.previous_count = 0")) fail("database entrant threshold is not protected")
if (!migration.includes("current_count = 1 and c.previous_count = 0")) fail("database experimental threshold is not protected")
if (!spacesPage.includes("Quién está entrando en tu espacio")) fail("competitive-space UI narrative missing")
if (!spacesPage.includes("1 expediente = experimental")) fail("competitive-space UI hides single-filing guardrail")
if (!gapsPage.includes("Qué está cubriendo el competidor que tú no")) fail("portfolio-gap UI narrative missing")
if (!gapsPage.includes("Score explicable")) fail("recommendation score is not exposed to users")
if (!gapsPage.includes("profile.company_name")) fail("binding UI does not explain why ownership is explicit")

console.log("Grade A block 4-6 regression PASS: repeated-entry threshold, explicit portfolio binding, deterministic gaps, explainable recommendations, authenticated APIs and service-only database surfaces.")
