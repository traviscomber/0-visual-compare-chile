import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const DEFAULT_DELAY_MS = 400
const DEFAULT_MAX_JOBS = 3
const LOG_FILE = path.resolve(process.cwd(), "tmp", "advance-inapi-window.log")

await main().catch((error) => {
  writeLog(`fatal ${error.stack ?? error.message}`)
  console.error(error)
  process.exitCode = 1
})

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const args = parseArgs(process.argv.slice(2))
  const dryRun = args["dry-run"] === "true"

  if (args.help === "true") {
    printUsage()
    return
  }

  if (!supabaseUrl || !serviceKey) {
    printUsage()
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  writeLog(`start pid=${process.pid} cwd=${process.cwd()} dryRun=${dryRun}`)
  const latestRuns = await selectLatestRuns(supabaseUrl, serviceKey)
  const activeRun = latestRuns.find((run) => run.status === "running") ?? null

  if (activeRun) {
    writeLog(`wait activeRun=${activeRun.id}`)
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "wait",
          reason: "active_run_in_progress",
          activeRun,
        },
        null,
        2,
      ),
    )
    return
  }

  const latestPhaseRun = latestRuns.find((run) => run.metadata?.preset === "phase1-10k") ?? null
  if (!latestPhaseRun) {
    throw new Error("No completed phase1-10k run found. Seed the first useful window manually.")
  }

  const continueWindow = buildContinueWindow(latestPhaseRun)
  if (!continueWindow) {
    throw new Error("Could not resolve batch start index from the latest phase1-10k run.")
  }

  const commandArgs = [
    "scripts/run-production-command.mjs",
    "node",
    "scripts/run-inapi-sync-pg.mjs",
    "--preset",
    "phase1-10k",
    "--startIndex",
    String(continueWindow.startIndex),
    "--maxJobs",
    String(continueWindow.maxJobs),
    "--delayMs",
    String(continueWindow.delayMs),
  ]

  writeLog(
    `nextWindow startIndex=${continueWindow.startIndex} maxJobs=${continueWindow.maxJobs} delayMs=${continueWindow.delayMs} retry=${continueWindow.retry} command=${process.execPath} ${commandArgs.join(" ")}`,
  )

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "launch_next_window",
          dryRun: true,
          nextWindow: continueWindow,
          command: `${process.execPath} ${commandArgs.join(" ")}`,
          basedOn: latestPhaseRun,
        },
        null,
        2,
      ),
    )
    return
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "launch_next_window",
        dryRun: false,
        nextWindow: continueWindow,
        basedOn: latestPhaseRun,
      },
      null,
      2,
    ),
  )

  await runCommand(process.execPath, commandArgs)
}

async function selectLatestRuns(supabaseUrl, serviceKey) {
  const url = new URL(`${supabaseUrl}/rest/v1/inapi_sync_runs`)
  url.searchParams.set("select", "id,status,query,search_type,started_at,finished_at,metadata")
  url.searchParams.set("order", "started_at.desc.nullslast")
  url.searchParams.set("limit", "50")

  const response = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to load inapi_sync_runs: ${response.status} ${await response.text()}`)
  }

  const payload = await response.json()
  return Array.isArray(payload) ? payload : []
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

function normalizeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : null
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
  console.log("Usage: node scripts/advance-inapi-window.mjs [--dry-run]")
  console.log("Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
}

function runCommand(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      env: process.env,
      shell: false,
    })

    writeLog(`spawned child pid=${child.pid ?? "unknown"}`)

    child.on("exit", (code, signal) => {
      writeLog(`child_exit code=${code ?? "null"} signal=${signal ?? "null"}`)
      if (signal) {
        reject(new Error(`Command terminated with signal ${signal}`))
        return
      }

      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Command exited with code ${code ?? 1}`))
    })

    child.on("error", (error) => {
      writeLog(`child_error ${error.stack ?? error.message}`)
      reject(error)
    })
  })
}

function writeLog(message) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`)
}

function buildContinueWindow(referenceRun) {
  const referenceStartIndex = readMetadataNumber(referenceRun?.metadata, "batch_start_index", "batchStartIndex")
  if (referenceStartIndex === null) {
    return null
  }

  const referenceWindowSize =
    readMetadataNumber(referenceRun?.metadata, "batch_window_size", "batchWindowSize") ?? DEFAULT_MAX_JOBS
  const referenceDelayMs = readMetadataNumber(referenceRun?.metadata, "delayMs") ?? DEFAULT_DELAY_MS
  const retry = referenceRun?.status === "failed"
  const windowSize = Math.max(referenceWindowSize, 1)
  const windowEndIndexExclusive = referenceStartIndex + windowSize
  const failedPosition = readMetadataNumber(referenceRun?.metadata, "position")
  const retryStartIndex = retry && failedPosition !== null
    ? Math.max(failedPosition - 1, referenceStartIndex)
    : referenceStartIndex
  const safeRetryStartIndex = Math.min(retryStartIndex, windowEndIndexExclusive - 1)

  return {
    startIndex: retry
      ? safeRetryStartIndex
      : Math.max(referenceStartIndex + windowSize, 0),
    maxJobs: retry
      ? Math.max(windowEndIndexExclusive - safeRetryStartIndex, 1)
      : windowSize,
    delayMs: referenceDelayMs,
    retry,
  }
}
