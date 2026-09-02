import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const [migration, contextSync, watchFusion, watchWriter, gleif, route, sourceNetwork] = await Promise.all([
  readFile("supabase/migrations/20260902002000_add_gdelt_context_fusion.sql", "utf8"),
  readFile("lib/intelligence/gdelt-context-sync.ts", "utf8"),
  readFile("lib/intelligence/gdelt-watch-fusion.ts", "utf8"),
  readFile("lib/intelligence/watch-event-writer.ts", "utf8"),
  readFile("lib/intelligence/gleif.ts", "utf8"),
  readFile("app/api/cron/gdelt-raw-feed/route.ts", "utf8"),
  readFile("lib/intelligence/source-network.ts", "utf8"),
])

assert.match(migration, /gdelt_event_mentions/, "mentions evidence table must exist")
assert.match(migration, /gdelt_gkg_documents/, "GKG projection table must exist")
assert.match(migration, /gdelt_gkg_document_versions/, "GKG immutable evidence must exist")
assert.match(migration, /unique \(artifact_id, source_row_hash\)/i, "mention identity must stay artifact plus raw-row hash")
assert.match(migration, /unique \(artifact_id, gkg_record_id\)/i, "GKG version identity must stay exact")
assert.match(migration, /claim_gdelt_context_artifact/, "context claiming must be atomic")
assert.match(migration, /interval '10 minutes'/, "stale claims must be recoverable")
assert.match(migration, /mention_linked_documents_only/, "GKG projection must be bounded to mention-linked documents")
assert.match(migration, /search_gdelt_watch_signals/, "watch search RPC must exist")
assert.match(migration, /normalized_exact_only/, "GLEIF identity policy must forbid fuzzy autolinking")
assert.match(migration, /enable row level security/gi, "context tables must enable RLS")

assert.match(contextSync, /CONTEXT_FALLBACK_INTERVALS=\[0,15,30,45\]/, "context must fall back to an earlier synchronized bundle")
assert.match(contextSync, /Range:"bytes=0-0"/, "bundle readiness must be probed before claiming artifacts")
assert.match(contextSync, /No complete synchronized GDELT context bundle available/, "incomplete provider bundles must fail before partial ingestion")
assert.match(contextSync, /mentions\.skipped && mentions\.skipReason==="processing"/, "concurrent Mentions processing must block GKG")
assert.match(contextSync, /upstream_processing/, "GKG must explicitly skip when Mentions is still processing")
assert.match(contextSync, /\.mentions\.CSV\.zip/, "sync must discover Mentions")
assert.match(contextSync, /\.gkg\.csv\.zip/, "sync must discover GKG")
assert.match(contextSync, /MentionIdentifier/, "Mentions must preserve document join")
assert.match(contextSync, /V2DOCUMENTIDENTIFIER/, "GKG must preserve document identity")
assert.match(contextSync, /ids\.has\(doc\)/, "GKG must be filtered by mention document identities")
assert.match(contextSync, /MAX_ZIP/, "compressed data must be bounded")
assert.match(contextSync, /MAX_CSV/, "uncompressed data must be bounded")

assert.match(gleif, /TIMEOUT_MS = 2_500/, "GLEIF per-request latency must be bounded")
assert.match(gleif, /attempts: 1/, "GLEIF enrichment must not consume the cron deadline with retries")
assert.match(gleif, /filter\[entity\.legalName\]/, "GLEIF must use the official legal-name filter")
assert.match(gleif, /normalizeLegalName\(item\.legalName\) === normalizedTarget/, "GLEIF must require normalized exact equality")
assert.match(gleif, /uniqueByLei\.size !== 1/, "ambiguous GLEIF matches must be rejected")

assert.match(watchFusion, /GLEIF_BUDGET_MS = 7_500/, "GLEIF must have a total per-run budget")
assert.match(watchFusion, /gleifCache/, "GLEIF results must be cached within the run")
assert.match(watchFusion, /\.range\(from, from \+ WATCH_PAGE_SIZE - 1\)/, "all active watches must be paginated")
assert.doesNotMatch(watchFusion, /\.limit\(WATCH_LIMIT\)/, "watch fusion must not silently stop at 100 watches")
assert.match(watchFusion, /search_gdelt_watch_signals/, "watch fusion must use canonical GDELT search")
assert.match(watchFusion, /gdelt-events-mentions-gkg-gleif-v1/, "signal lineage must be explicit")
assert.match(watchFusion, /persistIntelligenceWatchEvents/, "GDELT watch fusion must persist through the canonical event writer")
assert.doesNotMatch(watchFusion, /\.from\("intelligence_watch_events"\).*\.upsert/s, "GDELT fusion must not bypass the canonical writer")
assert.match(watchWriter, /onConflict: "user_id,watch_id,signal_key"/, "canonical event writer must preserve idempotent watch identity")
assert.match(watchWriter, /mergeIntelligenceWatchEvent/, "canonical event writer must preserve monotonic enrichment")
assert.ok(route.indexOf("syncGdeltRawFeed") < route.indexOf("syncGdeltContextBundle"), "Events must precede context")
assert.ok(route.indexOf("syncGdeltContextBundle") < route.indexOf("fuseGdeltIntoStrategicWatches"), "context must precede watch fusion")
for (const source of ["gdelt_mentions", "gdelt_gkg", "gleif"]) assert.match(sourceNetwork, new RegExp(`key: "${source}"`), `${source} must be registered`)
console.log("GDELT context fusion regression passed")
