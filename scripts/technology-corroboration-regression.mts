import {
  buildTechnologyCorroboration,
  isTechnologyTitleRelevant,
} from "../lib/intelligence/technology-corroboration-rules.ts"

function fail(message: string): never {
  console.error(`Technology corroboration regression FAIL: ${message}`)
  process.exit(1)
}

function assert(label: string, condition: boolean) {
  if (!condition) fail(label)
}

assert(
  "direct lithium extraction patent title should pass",
  isTechnologyTitleRelevant("extracción directa de litio", "Composiciones y métodos de extracción directa de litio"),
)
assert(
  "green hydrogen patent title should pass",
  isTechnologyTitleRelevant("hidrógeno verde", "Sistema para la generación de hidrógeno verde"),
)
assert(
  "generic hydrogen must not corroborate green hydrogen",
  !isTechnologyTitleRelevant("hidrógeno verde", "Electrolizador para producción de hidrógeno"),
)
assert(
  "electrochemical graphite must not corroborate electrochemical desalination",
  !isTechnologyTitleRelevant("desalación electroquímica", "Exfoliación electroquímica de grafito para la producción de escamas de grafeno"),
)
assert(
  "electrochemical lithium extraction must not corroborate electrochemical desalination",
  !isTechnologyTitleRelevant("desalación electroquímica", "Método para la extracción de litio por medio de desintercalación electroquímica"),
)

const corroborated = buildTechnologyCorroboration({
  researchAvailable: true,
  currentPublications: 4,
  researchTrend: "acelerando",
  patentsAvailable: true,
  recentPatentMatches: 2,
  historicalPatentMatches: 8,
})
assert("two current hard axes should corroborate", corroborated.status === "corroborada")
assert("v1 confidence must not claim high confidence with only two axes", corroborated.confidence === "media")
assert("two current hard axes should count as two confirmations", corroborated.confirming_axes === 2)

const historicalOnly = buildTechnologyCorroboration({
  researchAvailable: true,
  currentPublications: 9,
  researchTrend: "estable",
  patentsAvailable: true,
  recentPatentMatches: 0,
  historicalPatentMatches: 6,
})
assert("historical patents must not masquerade as current corroboration", historicalOnly.status === "parcial")
assert("historical-only protection should keep confidence low", historicalOnly.confidence === "baja")

const unavailable = buildTechnologyCorroboration({
  researchAvailable: true,
  currentPublications: 2,
  researchTrend: "estable",
  patentsAvailable: false,
  recentPatentMatches: 0,
  historicalPatentMatches: 0,
})
assert("missing patent source must be insufficient", unavailable.status === "insuficiente")
assert("missing hard source must not be scored as confidence", unavailable.confidence === "insuficiente")

console.log("Technology corroboration regression PASS: title evidence is precision-first and confidence never exceeds the available independent hard axes.")
