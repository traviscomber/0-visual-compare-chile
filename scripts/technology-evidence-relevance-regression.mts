import { readFile } from "node:fs/promises"
import { isCrossrefQueryRelevant } from "../lib/intelligence/crossref.ts"
import { normalizeTechnologyQuery } from "../lib/intelligence/technology-query.ts"

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

if (!openalex.includes("title.search")) {
  fail("OpenAlex executive momentum must be title-led")
}
if (openalex.includes("title_and_abstract.search")) {
  fail("OpenAlex executive momentum must not let abstract-only matches move the KPI")
}
if (openalex.includes("search: query")) {
  fail("OpenAlex technology momentum must not scan full text")
}
if (!openalex.includes("technologyFilter(query, from, to)")) {
  fail("OpenAlex counts and visible momentum evidence must share the same conservative technology filter")
}
if (!openalex.includes("keeps the executive momentum KPI title-led")) {
  fail("OpenAlex conservative momentum invariant is undocumented")
}
if (!signals.includes("Señal conservadora")) {
  fail("technology response does not disclose the conservative momentum basis")
}

for (const needle of [
  "searchOpenAlexDiscovery",
  "buildOpenAlexDiscoveryOql",
  'url.searchParams.set("oql", oql)',
  "title/abstract has",
  "Broader title/abstract",
  "buildStrategicSearchIntent(query, \"global\")",
]) {
  if (!openalex.includes(needle)) fail(`OpenAlex discovery layer missing ${needle}`)
}
if (openalex.includes("/works?oql")) fail("OQL discovery must execute at the OpenAlex API root, not /works")

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

assert(
  "unaccented thermal storage must canonicalize to the accented technology",
  normalizeTechnologyQuery("ALMACENAMIENTO TERMICO") === "almacenamiento térmico",
)
assert(
  "unaccented green hydrogen must canonicalize to the accented technology",
  normalizeTechnologyQuery("  Hidrogeno   Verde ") === "hidrógeno verde",
)
assert(
  "query punctuation must not create a separate OpenAlex search",
  normalizeTechnologyQuery("Extraccion: directa | de litio") === "extracción directa de litio",
)

if (!openalex.includes("fetchWithRetry")) fail("OpenAlex transient 429/5xx responses are not retried")
if (!openalex.includes('cache: "force-cache"')) fail("OpenAlex successful reads are not using the Vercel/Next data cache")
if (!openalex.includes("OPENALEX_REVALIDATE_SECONDS = 6 * 60 * 60")) fail("OpenAlex cache TTL is not locked to the six-hour budget")
if (!openalex.includes("next: { revalidate: OPENALEX_REVALIDATE_SECONDS }")) fail("OpenAlex cache is missing time-based revalidation")
if (!openalex.includes("inFlightOpenAlex")) fail("OpenAlex identical in-flight requests are not deduplicated")
if (openalex.includes('cache: "no-store"')) fail("OpenAlex still bypasses caching")

const openAlexWindowCalls = signals.match(/queryOpenAlexWindow\(/g)?.length ?? 0
if (openAlexWindowCalls !== 2) fail(`technology analysis must use exactly two OpenAlex window calls, found ${openAlexWindowCalls}`)
if (signals.includes("countOpenAlexWorks")) fail("technology analysis still performs a separate OpenAlex count request")
if (signals.includes("searchOpenAlexWorks")) fail("technology analysis still performs a separate OpenAlex evidence request")

if (!signals.includes('"no_disponible"')) fail("technology momentum lacks an unavailable state")
if (!signals.includes("current_publications: currentCount")) fail("technology momentum does not preserve nullable source state")
if (signals.includes("openalex: { available: true")) fail("OpenAlex availability is hard-coded true")
if (!signals.includes("openAlexAvailable")) fail("OpenAlex availability is not derived from source outcomes")
if (!workbench.includes("El resultado no asume que eso signifique cero actividad")) fail("UI does not explain unavailable core-source semantics in plain language")
if (!workbench.includes('key !== "gdelt" && !source.available')) fail("GDELT-only outage can still trigger the global technology warning")
if (!workbench.includes("Noticias temporalmente no disponibles")) fail("GDELT outage is not scoped to the Context section")
if (!workbench.includes('value={result.momentum.current_publications ?? "—"}')) fail("UI can still render source failure as zero publications")

console.log("Technology evidence relevance regression PASS: executive momentum remains title-led and conservative, broader OQL title/abstract discovery is isolated from the KPI, Crossref rejects weak matches, transient limits retry, and source outages never become false zero activity.")
