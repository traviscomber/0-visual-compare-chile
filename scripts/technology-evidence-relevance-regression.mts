import { readFile } from "node:fs/promises"
import { isCrossrefQueryRelevant } from "../lib/intelligence/crossref.ts"

function fail(message: string): never {
  console.error(`Technology evidence relevance regression FAIL: ${message}`)
  process.exit(1)
}

function assert(label: string, condition: boolean) {
  if (!condition) fail(label)
}

const openalex = await readFile("lib/intelligence/openalex.ts", "utf8")
const crossref = await readFile("lib/intelligence/crossref.ts", "utf8")

if (openalex.includes('sort: "publication_date:desc"')) {
  fail("OpenAlex search must preserve provider relevance ordering instead of forcing publication date")
}

if (crossref.includes('url.searchParams.set("sort", "published")')) {
  fail("Crossref search must preserve provider relevance ordering instead of forcing publication date")
}

if (!openalex.includes("Preserve OpenAlex's default relevance ordering")) {
  fail("OpenAlex relevance-ordering invariant is undocumented")
}

if (!crossref.includes("Keep Crossref's relevance ranking")) {
  fail("Crossref relevance-ordering invariant is undocumented")
}

if (!crossref.includes('url.searchParams.set("query.title", query)')) {
  fail("Crossref technology search must be title-led")
}

assert(
  "direct lithium extraction evidence should pass",
  isCrossrefQueryRelevant("extracción directa de litio", "Tecnologías de extracción directa de litio"),
)
assert(
  "lithium extraction context should pass with two meaningful terms",
  isCrossrefQueryRelevant("extracción directa de litio", "La extracción de litio en el salar de Atacama"),
)
assert(
  "generic extraction evidence must not pass",
  !isCrossrefQueryRelevant("extracción directa de litio", "Sistemas de detección de humo por extracción de muestras"),
)
assert(
  "unrelated extraction domain must not pass",
  !isCrossrefQueryRelevant("extracción directa de litio", "Curvas de crecimiento y extracción de nutrientes de cannabis"),
)
assert(
  "lithium-only evidence must not masquerade as extraction technology evidence",
  !isCrossrefQueryRelevant("extracción directa de litio", "Baterías de ion-litio: funcionamiento y composición"),
)
assert(
  "two-term technology query requires both meaningful terms",
  !isCrossrefQueryRelevant("hidrógeno verde", "Producción de hidrógeno gris"),
)
assert(
  "two-term technology query accepts direct match",
  isCrossrefQueryRelevant("hidrógeno verde", "Producción y almacenamiento de hidrógeno verde"),
)

console.log("Technology evidence relevance regression PASS: provider relevance is preserved and weak Crossref topical matches are rejected.")
