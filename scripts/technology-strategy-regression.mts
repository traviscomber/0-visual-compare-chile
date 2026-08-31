import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Technology strategy regression FAIL: ${message}`)
  process.exit(1)
}
function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

const [strategy, route, page, primary] = await Promise.all([
  readFile("lib/intelligence/technology-strategy.ts", "utf8"),
  readFile("app/api/intelligence/technology-strategy/route.ts", "utf8"),
  readFile("components/intelligence/technology-strategy-workbench.tsx", "utf8"),
  readFile("app/(app)/tecnologias/page.tsx", "utf8"),
])

for (const needle of [
  'TechnologyMaturityLevel = "insufficient" | "exploratory" | "emerging" | "scaling" | "established"',
  'TechnologyAdoptionLevel = "insufficient" | "early" | "moderate" | "strong"',
  'Clasificación de madurez de evidencia, no de madurez comercial.',
  'Proxy de adopción basado en difusión científica y actividad de propiedad industrial.',
  'label: "Actores emergentes observados"',
  'label: "Movimientos competitivos observados"',
  'Emergente significa visible en la evidencia reciente de esta consulta; no demuestra que el actor sea nuevo en el mercado.',
  'Un filing o una publicación es actividad observable, no una declaración de estrategia o intención futura.',
  'type: "patent_filing" as const',
  'type: "research_presence" as const',
]) requireText(strategy, needle, "strategy rules")

for (const needle of [
  "requireUser()",
  "buildTechnologySignals(parsed.data.q, parsed.data.windowDays)",
  "buildTechnologyStrategy(signals)",
  'action: "technology.strategy_reading"',
]) requireText(route, needle, "strategy API")
if (route.includes("createAdminClient") || route.includes("SUPABASE_SERVICE_ROLE_KEY")) fail("strategy API must use the authenticated technology pipeline rather than handling service-role access directly")

for (const needle of [
  "Madurez de evidencia",
  "Proxy de adopción",
  "strategy.emerging_players.label",
  "strategy.competitive_moves.label",
  "No equivale a adopción comercial",
  "No hay movimientos suficientes para destacar sin inventar intención.",
  "Vigilar tecnología",
]) requireText(page, needle, "strategy UI")

requireText(primary, 'href="/tecnologias/estrategia"', "technology primary workspace")
requireText(primary, "Lectura estratégica", "technology primary workspace")

console.log("Technology strategy regression PASS: maturity, adoption proxy, observed actors and competitive moves are derived from current evidence and explicitly avoid commercial-maturity or corporate-intent claims.")
