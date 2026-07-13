import { createClient } from "@supabase/supabase-js"

const DEFAULT_DELAY_MS = 400
const DEFAULT_MAX_JOBS = 3

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (process.argv.includes("--help")) {
  printUsage()
  process.exit(0)
}

if (!supabaseUrl || !serviceKey) {
  printUsage()
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const [runsResponse, recordsResponse, totalsResponse] = await Promise.all([
  supabase
    .from("inapi_sync_runs")
    .select("id, status, query, search_type, total_fetched, inserted_count, updated_count, error_message, started_at, finished_at, metadata")
    .order("started_at", { ascending: false, nullsFirst: false })
    .limit(12),
  supabase.from("trademark_records").select("id", { count: "exact", head: true }),
  supabase
    .from("inapi_sync_runs")
    .select("id, status")
    .order("started_at", { ascending: false, nullsFirst: false })
    .limit(500),
])

for (const response of [runsResponse, recordsResponse, totalsResponse]) {
  if (response.error) {
    console.error(response.error)
    process.exit(1)
  }
}

const runs = runsResponse.data ?? []
const totals = totalsResponse.data ?? []
const activeRun = runs.find((run) => run.status === "running") ?? null
const latestPhaseRun = runs.find((run) => run.metadata?.preset === "phase1-10k") ?? null
const referenceRun = activeRun?.metadata?.preset === "phase1-10k" ? activeRun : latestPhaseRun
const referenceStartIndex = readMetadataNumber(referenceRun?.metadata, "batch_start_index", "batchStartIndex")
const referenceWindowSize =
  readMetadataNumber(referenceRun?.metadata, "batch_window_size", "batchWindowSize") ?? DEFAULT_MAX_JOBS
const referenceDelayMs = readMetadataNumber(referenceRun?.metadata, "delayMs") ?? DEFAULT_DELAY_MS
const nextStartIndex =
  referenceStartIndex === null ? null : Math.max(referenceStartIndex + Math.max(referenceWindowSize, 1), 0)

console.log(
  JSON.stringify(
    {
      totalRecords: recordsResponse.count ?? 0,
      runs: {
        total: totals.length,
        completed: totals.filter((run) => run.status === "completed").length,
        running: totals.filter((run) => run.status === "running").length,
        failed: totals.filter((run) => run.status === "failed").length,
      },
      latestRuns: runs,
      activeRun,
      continueWindow:
        nextStartIndex === null
          ? null
          : {
              safeWhen: activeRun ? "after_active_run_finishes" : "now",
              startIndex: nextStartIndex,
              maxJobs: referenceWindowSize,
              delayMs: referenceDelayMs,
              command: `pnpm sync:inapi:prod -- --preset phase1-10k --startIndex ${nextStartIndex} --maxJobs ${referenceWindowSize} --delayMs ${referenceDelayMs}`,
            },
    },
    null,
    2,
  ),
)

function readMetadataNumber(metadata, ...keys) {
  if (!metadata || typeof metadata !== "object") {
    return null
  }

  for (const key of keys) {
    const normalized = normalizeNumber(metadata[key])
    if (normalized !== null) {
      return normalized
    }
  }

  return null
}

function normalizeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : null
}

function printUsage() {
  console.log("Usage: node scripts/monitor-inapi-window.mjs")
  console.log("Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
}
