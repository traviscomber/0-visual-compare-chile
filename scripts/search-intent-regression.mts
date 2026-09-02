import { readFile } from "node:fs/promises"
import { buildStrategicSearchIntent, strategicSemanticKey } from "../lib/intelligence/search-intent.ts"
import { mergeIntelligenceWatchEvent, type IntelligenceWatchEventWrite } from "../lib/intelligence/watch-event-merge.ts"

function fail(message: string): never {
  console.error(`Search intent regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

const english = buildStrategicSearchIntent("enterprise AI agents", "both")
if (!english.chileQueries.some(value => /agentes de IA empresariales/i.test(value))) fail("enterprise AI agents must expand to a Chilean Spanish query")
if (!english.globalQueries.some(value => /enterprise AI agents/i.test(value))) fail("enterprise AI agents must preserve an English global query")
if (!english.concept.core.some(value => /agentic AI/i.test(value))) fail("enterprise agent intent must include controlled adjacent terminology")
if (!english.concept.context.some(value => /workflow|operations/i.test(value))) fail("enterprise agent intent must include business context")
if (!english.concept.exclusions.some(value => /agent-based model/i.test(value))) fail("enterprise agent intent must carry a known ambiguity exclusion")
if (english.conceptKey !== "enterprise ai agents") fail("enterprise agent concept key must stay stable")

const spanish = buildStrategicSearchIntent("agentes de IA empresariales", "both")
if (!spanish.globalQueries.some(value => /enterprise AI agents/i.test(value))) fail("Spanish IA query must expand back to enterprise AI agents")
if (spanish.aliases.some(value => /agents de AI enterprise/i.test(value))) fail("controlled exact concepts must not emit hybrid-language aliases")
if (strategicSemanticKey("enterprise AI agents") !== strategicSemanticKey("agentes de IA empresariales")) fail("AI/IA equivalents must share one semantic watch key")
if (spanish.conceptKey !== english.conceptKey) fail("Spanish and English forms must share one concept identity")

const workflow = buildStrategicSearchIntent("AI workflow automation enterprise", "both")
if (!workflow.chileQueries.some(value => /automatizaci[oó]n de flujos de trabajo empresariales con IA/i.test(value))) fail("workflow automation must have a controlled Spanish expansion")
if (!workflow.concept.exclusions.some(value => /laboratory automation/i.test(value))) fail("workflow automation must exclude laboratory-automation ambiguity")
if (strategicSemanticKey("AI workflow automation enterprise") !== strategicSemanticKey("automatización de flujos de trabajo empresariales con IA")) fail("workflow ES/EN equivalents must share one semantic watch key")

const operations = buildStrategicSearchIntent("operational intelligence AI software", "both")
if (!operations.concept.exclusions.some(value => /emotional intelligence/i.test(value))) fail("operational intelligence must exclude emotional-intelligence ambiguity")
if (!operations.concept.core.some(value => /decision intelligence/i.test(value))) fail("operational intelligence must include decision-intelligence adjacency")

const [googleNews, watchlist, commonWatches, commonWatchesPage, scanner, technologySignals, technologyRoute, newWatchPage, openalex, qualityRoute, qualitySource, writer, cronWriter, gdeltWriter] = await Promise.all([
  readFile("lib/intelligence/google-news.ts", "utf8"),
  readFile("app/api/intelligence/strategic-watchlist/route.ts", "utf8"),
  readFile("app/api/intelligence/watches/route.ts", "utf8"),
  readFile("app/(app)/monitorear/page.tsx", "utf8"),
  readFile("lib/intelligence/strategic-watch-scanner.ts", "utf8"),
  readFile("lib/intelligence/technology-signals.ts", "utf8"),
  readFile("app/api/intelligence/technology-signals/route.ts", "utf8"),
  readFile("app/(app)/monitorear/estrategico/nueva/page.tsx", "utf8"),
  readFile("lib/intelligence/openalex.ts", "utf8"),
  readFile("app/api/intelligence/strategic-watch-signals/route.ts", "utf8"),
  readFile("lib/intelligence/research-quality.ts", "utf8"),
  readFile("lib/intelligence/watch-event-writer.ts", "utf8"),
  readFile("app/api/cron/strategic-watches/route.ts", "utf8"),
  readFile("lib/intelligence/gdelt-watch-fusion.ts", "utf8"),
])

for (const needle of ['"es-419"', '"CL"', '"CL:es-419"', '"en-US"', '"US:en"']) requireText(googleNews, needle, "Google News market routing")
for (const needle of ['z.enum(["chile", "global", "both"])', "strategicSemanticKey", "mergeStrategicSearchMetadata", "getOrCreatePrimaryOrganization", "organization_id", '"semantic_duplicate"', "last_checked_at: null", "last_reviewed_at: null"]) requireText(watchlist, needle, "strategic watchlist")
for (const needle of ["SearchScopeSchema", "strategicSemanticKey(query)", "mergeStrategicSearchMetadata", "getOrCreatePrimaryOrganization", "organization_id", "readStrategicSearchScope(row.metadata)", '"semantic_duplicate"', "last_checked_at: null", "last_reviewed_at: null"]) requireText(commonWatches, needle, "common Watches API")
if (commonWatches.includes("metadata: {}")) fail("common Watches API must never erase technology search intent metadata")
for (const needle of ['type SearchScope = "chile" | "global" | "both"', 'aria-label="Dónde buscar"', '<option value="chile">Chile</option>', '<option value="global">Global</option>', '<option value="both">Ambos</option>', 'type==="technology"?{scope}:{}', 'scopeLabel(watch.searchScope)', 'IA / AI']) requireText(commonWatchesPage, needle, "common Watches UI")
for (const needle of ['scope !== "global"', 'scope !== "chile"', 'search_scope: "chile"', 'search_scope: "global"', "intent.chileQueries", "intent.globalQueries"]) requireText(scanner, needle, "strategic scanner")
for (const needle of ["globalQuery", "chileQuery", "buildTechnologyPatentSignal(chileQuery", "queryOpenAlexWindow(globalQuery"]) requireText(technologySignals, needle, "technology signals")
for (const needle of ["videntia_search_scope", "buildTechnologySignals(parsed.data.q, parsed.data.windowDays, parsed.data.scope"]) requireText(technologyRoute, needle, "technology route")
for (const needle of ['label="Chile"', 'label="Global"', 'label="Ambos"', "IA / AI", "scope"]) requireText(newWatchPage, needle, "new strategic watch UI")

for (const needle of ["searchOpenAlexDiscovery", "buildOpenAlexDiscoveryOql", 'url.searchParams.set("oql", oql)', "title/abstract has", "Broader title/abstract", "queryOpenAlexWindow"]) requireText(openalex, needle, "OpenAlex split retrieval")
for (const needle of ["applyTechnologyResearchQuality", "loadResearchProfilesForWatches", "researchProfileForWatch", 'version: "research-quality-v1"', "payloadScore", "persistIntelligenceWatchEvents"]) requireText(qualityRoute, needle, "research quality route")
for (const needle of ["relevance_score", "relevance_factors", "signal_kind", "company_fit_matches", "cluster_size", "NEWS_CLUSTER_THRESHOLD", "exclusionPenalty"]) requireText(qualitySource, needle, "research quality engine")

for (const [source, label] of [[qualityRoute, "interactive strategic signals"], [cronWriter, "strategic cron"], [gdeltWriter, "GDELT watch fusion"]] as const) {
  requireText(source, "persistIntelligenceWatchEvents", label)
  if (/\.from\(["']intelligence_watch_events["']\)[\s\S]{0,220}\.upsert\(/.test(source)) fail(`${label} must not upsert intelligence_watch_events directly`)
}
requireText(cronWriter, 'last_reviewed_at,metadata")', "strategic cron organization-aware scan")
requireText(writer, '.from("intelligence_watch_events")', "canonical watch event writer")
requireText(writer, "mergeIntelligenceWatchEvent", "canonical watch event writer")

const baseRow: IntelligenceWatchEventWrite = {
  user_id: "00000000-0000-4000-8000-000000000001",
  watch_id: "00000000-0000-4000-8000-000000000002",
  signal_key: "openalex:publication:test",
  source_key: "openalex",
  event_type: "publication",
  title: "Enterprise AI agents in production",
  summary: null,
  source_url: null,
  occurred_at: "2026-09-01T00:00:00.000Z",
  relevance: "media",
  payload: { retrieval_mode: "raw" },
  last_seen_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

const enriched = mergeIntelligenceWatchEvent({
  ...baseRow,
  relevance: "alta",
  payload: { ...baseRow.payload, quality_version: "research-quality-v1", relevance_score: 84, signal_kind: "adoption", company_fit_matches: ["Agentes de IA"] },
})
const downgradeAttempt = mergeIntelligenceWatchEvent(baseRow, {
  user_id: enriched.user_id,
  watch_id: enriched.watch_id,
  signal_key: enriched.signal_key,
  relevance: enriched.relevance,
  payload: enriched.payload,
})
if (downgradeAttempt.relevance !== "alta") fail("raw writer must not downgrade enriched relevance")
if (downgradeAttempt.payload.quality_version !== "research-quality-v1") fail("raw writer must not erase research quality version")
if (downgradeAttempt.payload.relevance_score !== 84) fail("raw writer must not erase relevance score")
if (downgradeAttempt.payload.signal_kind !== "adoption") fail("raw writer must not erase signal classification")

const refreshed = mergeIntelligenceWatchEvent({
  ...baseRow,
  relevance: "media",
  payload: { quality_version: "research-quality-v1", relevance_score: 67, signal_kind: "research" },
}, {
  user_id: enriched.user_id,
  watch_id: enriched.watch_id,
  signal_key: enriched.signal_key,
  relevance: enriched.relevance,
  payload: enriched.payload,
})
if (refreshed.relevance !== "media" || refreshed.payload.relevance_score !== 67) fail("new quality pass must be allowed to recalibrate prior quality")

console.log("Search intent regression PASS: AI/IA equivalents share one concept identity, source scope stays explicit, Search Intent V2 remains auditable, and every strategic event writer now uses a canonical monotonic persistence path that prevents raw refreshes from erasing research-quality enrichment.")
