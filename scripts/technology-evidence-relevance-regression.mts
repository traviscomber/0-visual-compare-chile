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
const signals = await readFile("lib/intelligence/technology-signals.ts", "utf8")
const workbench = await readFile("components/intelligence/technology-signals-workbench.tsx", "utf8")

if (openalex.includes('sort: "publication_date:desc"')) {
  fail("OpenAlex search must not force publication date ahead of relevance")
}

if (crossref.includes('url.searchParams.set("sort", "published")')) {
  fail("Crossref search must preserve provider relevance ordering instead of forcing publication date")
}

if (!openalex.includes("title_and_abstract.search")) {
  fail("OpenAlex technology universe must be scoped to title and abstract")
}
if (openalex.includes("search: query")) {
  fail("OpenAlex technology momentum must not scan full text")
}
if (!openalex.includes("technologyFilter(query, from, to)")) {
  fail("OpenAlex counts and visible evidence must share the same technology filter")
}
if (!openalex.includes("executive evidence and inflate the momentum denominator")) {
  fail("OpenAlex title/abstract scope invariant is undocumented")
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

if (!openalex.includes("fetchWithRetry")) fail("OpenAlex transient 429/5xx responses are not retried")
if (!signals.includes('"no_disponible"')) fail("technology momentum lacks an unavailable state")
if (!signals.includes("current_publications: currentCount")) fail("technology momentum does not preserve nullable source state")
if (signals.includes("openalex: { available: true")) fail("OpenAlex availability is hard-coded true")
if (!signals.includes("openAlexAvailable")) fail("OpenAlex availability is not derived from source outcomes")
if (!workbench.includes("no interpreta una fuente sin respuesta como ausencia de actividad")) fail("UI does not explain unavailable-source semantics")
if (!workbench.includes('value={result.momentum.current_publications ?? "—"}')) fail("UI can still render source failure as zero publications")

console.log("Technology evidence relevance regression PASS: OpenAlex momentum and evidence share a title/abstract universe, Crossref rejects weak matches, transient limits retry, and source outages never become false zero activity.")
