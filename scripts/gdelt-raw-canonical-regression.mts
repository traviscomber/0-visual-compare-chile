import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const [migration, sync, route, sourceNetwork, vercel] = await Promise.all([
  readFile("supabase/migrations/20260901234500_add_gdelt_raw_canonical_ingestion.sql", "utf8"),
  readFile("lib/intelligence/gdelt-raw-sync.ts", "utf8"),
  readFile("app/api/cron/gdelt-raw-feed/route.ts", "utf8"),
  readFile("lib/intelligence/source-network.ts", "utf8"),
  readFile("vercel.json", "utf8"),
])

assert.match(migration, /gdelt_raw_artifacts/, "artifact provenance table must exist")
assert.match(migration, /gdelt_event_records/, "canonical event table must exist")
assert.match(migration, /gdelt_event_versions/, "immutable event observations must exist")
assert.match(migration, /unique \(artifact_id, global_event_id\)/i, "raw observations must deduplicate only exact artifact/event identity")
assert.match(migration, /global_event_id bigint primary key/i, "GLOBALEVENTID must be the canonical identity")
assert.match(migration, /claim_gdelt_raw_artifact/, "artifact claiming must be atomic")
assert.match(migration, /interval '10 minutes'/, "stale processing claims must be recoverable")
assert.match(migration, /grant execute .*service_role/is, "claim RPC must be service-role only")

assert.match(sync, /GLOBALEVENTID/, "parser must preserve the official identity field")
assert.match(sync, /raw_payload/, "normalized events must preserve raw source fields")
assert.match(sync, /raw_row/, "immutable evidence must preserve the exact raw row")
assert.match(sync, /createHash\("sha256"\)/, "artifact bytes must be fingerprinted")
assert.match(sync, /MAX_COMPRESSED_BYTES/, "compressed payload must be bounded")
assert.match(sync, /MAX_UNCOMPRESSED_BYTES/, "uncompressed payload must be bounded")
assert.match(sync, /artifact_id,global_event_id/, "version writes must be idempotent by exact source identity")
const conflictKeys = [...sync.matchAll(/onConflict:\s*"([^"]+)"/g)].map(match => match[1])
assert.deepEqual(new Set(conflictKeys), new Set(["artifact_id,global_event_id", "global_event_id"]), "only exact artifact/event and GLOBALEVENTID identities may drive canonical upserts")
assert.ok(conflictKeys.every(key => !key.includes("source_url")), "source URL must never be used as event identity")

assert.match(route, /CRON_SECRET/, "canonical cron must require Vercel cron authentication")
assert.match(route, /syncGdeltRawFeed/, "canonical cron must invoke the canonical sync")
assert.match(sourceNetwork, /key: "gdelt_raw_feed"/, "source network must register the raw feed separately")
assert.match(sourceNetwork, /GLOBALEVENTID/, "source contract must state canonical identity")
assert.match(sourceNetwork, /key: "gdelt"[\s\S]*endpoint DOC permanece desactivado/, "DOC transport must remain explicitly separate and disabled operationally")

const config = JSON.parse(vercel) as { crons?: Array<{ path: string; schedule: string }> }
const gdeltCron = config.crons?.find(item => item.path === "/api/cron/gdelt-raw-feed")
assert.deepEqual(gdeltCron, { path: "/api/cron/gdelt-raw-feed", schedule: "7,22,37,52 * * * *" })

console.log("GDELT raw canonical regression passed")
