import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const targetRecords = Number.isFinite(Number(process.env.INAPI_TARGET_RECORDS))
  ? Math.max(1, Number(process.env.INAPI_TARGET_RECORDS))
  : 10000

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

const [records, niza, viena, latestRun, successfulRuns, failedRuns] = await Promise.all([
  supabase.from("trademark_records").select("id", { count: "exact", head: true }),
  supabase.from("trademark_record_niza").select("trademark_record_id", { count: "exact", head: true }),
  supabase.from("trademark_record_viena").select("trademark_record_id", { count: "exact", head: true }),
  supabase
    .from("inapi_sync_runs")
    .select("id, status, query, search_type, total_fetched, inserted_count, updated_count, error_message, started_at, finished_at, metadata")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle(),
  supabase.from("inapi_sync_runs").select("id", { count: "exact", head: true }).eq("status", "completed"),
  supabase.from("inapi_sync_runs").select("id", { count: "exact", head: true }).eq("status", "failed"),
])

for (const result of [records, niza, viena, latestRun, successfulRuns, failedRuns]) {
  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }
}

const totalRecords = records.count ?? 0
const progressPct = Math.min(100, Math.round((totalRecords / targetRecords) * 10000) / 100)

console.log(
  JSON.stringify(
    {
      targetRecords,
      totalRecords,
      progressPct,
      reachedTarget: totalRecords >= targetRecords,
      coverage: {
        trademarkRecordNizaRows: niza.count ?? 0,
        trademarkRecordVienaRows: viena.count ?? 0,
      },
      runs: {
        successful: successfulRuns.count ?? 0,
        failed: failedRuns.count ?? 0,
        latest: latestRun.data ?? null,
      },
    },
    null,
    2,
  ),
)

function printUsage() {
  console.log("Usage: node scripts/inapi-sync-evidence.mjs")
  console.log("Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  console.log("Optional env: INAPI_TARGET_RECORDS=10000")
}
