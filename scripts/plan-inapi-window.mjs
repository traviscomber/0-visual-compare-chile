import { createClient } from "@supabase/supabase-js"

const PHASE1_NAME_SEEDS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "AL", "AR", "BIO", "CASA", "CHILE", "CLUB", "DATA", "ECO", "EL", "FARMA", "GO", "LAB", "LA", "MAX", "MI", "MUNDO", "NET", "NOVA",
  "PLUS", "PRO", "PUNTO", "RED", "SAN", "SMART", "SOL", "SUR", "TEC", "TU", "VITA",
]
const PHASE1_APPLICANT_SEEDS = ["SPA", "S.A.", "LTDA", "LIMITADA", "INVERSIONES", "COMERCIAL", "SERVICIOS", "HOLDING", "TECNOLOGIA", "INDUSTRIAL"]
const PHASE1_TOTAL_JOBS = 45 + PHASE1_NAME_SEEDS.length + PHASE1_APPLICANT_SEEDS.length

const args = parseArgs(process.argv.slice(2))
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const windowSize = Number.isFinite(Number(args.maxJobs ?? process.env.INAPI_WINDOW_SIZE))
  ? Math.max(1, Math.floor(Number(args.maxJobs ?? process.env.INAPI_WINDOW_SIZE)))
  : 25

if (args.help === "true") {
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

const { data, error } = await supabase
  .from("inapi_sync_runs")
  .select("id, status, created_at, total_fetched, inserted_count, updated_count, metadata")
  .eq("status", "completed")
  .order("created_at", { ascending: false })
  .limit(200)

if (error) {
  console.error(error)
  process.exit(1)
}

const phaseRuns = (data ?? []).filter((run) => run.metadata?.preset === "phase1-10k")
const covered = new Set()

for (const run of phaseRuns) {
  const start = readMetadataNumber(run.metadata, "batch_start_index", "batchStartIndex")
  const size = readMetadataNumber(run.metadata, "batch_window_size", "batchWindowSize")
  if (start === null || size === null) continue
  for (let index = start; index < start + size; index += 1) {
    covered.add(index)
  }
}

let nextStartIndex = 0
while (covered.has(nextStartIndex) && nextStartIndex < PHASE1_TOTAL_JOBS) {
  nextStartIndex += 1
}

const remainingJobs = Math.max(PHASE1_TOTAL_JOBS - nextStartIndex, 0)
const suggestedMaxJobs = Math.min(windowSize, remainingJobs)

console.log(
  JSON.stringify(
    {
      preset: "phase1-10k",
      totalJobs: PHASE1_TOTAL_JOBS,
      completedWindowRuns: phaseRuns.length,
      coveredJobs: covered.size,
      remainingJobs,
      nextWindow: remainingJobs > 0
        ? {
            startIndex: nextStartIndex,
            maxJobs: suggestedMaxJobs,
          }
        : null,
      latestCompletedPhaseRun: phaseRuns[0] ?? null,
      suggestedCommand:
        remainingJobs > 0
          ? `pnpm sync:inapi --preset phase1-10k --startIndex ${nextStartIndex} --maxJobs ${suggestedMaxJobs} --delayMs 400`
          : null,
    },
    null,
    2,
  ),
)

function normalizeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : null
}

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

function parseArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (!current.startsWith("--")) continue
    const key = current.slice(2)
    const next = argv[index + 1]
    result[key] = next && !next.startsWith("--") ? next : "true"
    if (next && !next.startsWith("--")) {
      index += 1
    }
  }
  return result
}

function printUsage() {
  console.log("Usage: node scripts/plan-inapi-window.mjs [--maxJobs 25]")
  console.log("Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  console.log("Optional env: INAPI_WINDOW_SIZE=25")
}
