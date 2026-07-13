import { spawn } from "node:child_process"
import { createClient } from "@supabase/supabase-js"

const DEFAULT_DELAY_MS = 400
const DEFAULT_MAX_JOBS = 3

await main().catch((error) => {
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

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: runs, error } = await supabase
    .from("inapi_sync_runs")
    .select("id, status, query, search_type, started_at, finished_at, metadata")
    .order("started_at", { ascending: false, nullsFirst: false })
    .limit(50)

  if (error) {
    throw error
  }

  const latestRuns = runs ?? []
  const activeRun = latestRuns.find((run) => run.status === "running") ?? null

  if (activeRun) {
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

  const startIndex = readMetadataNumber(latestPhaseRun.metadata, "batch_start_index", "batchStartIndex")
  const maxJobs =
    readMetadataNumber(latestPhaseRun.metadata, "batch_window_size", "batchWindowSize") ?? DEFAULT_MAX_JOBS
  const delayMs = readMetadataNumber(latestPhaseRun.metadata, "delayMs") ?? DEFAULT_DELAY_MS

  if (startIndex === null) {
    throw new Error("Could not resolve batch start index from the latest phase1-10k run.")
  }

  const nextStartIndex = startIndex + Math.max(maxJobs, 1)
  const commandArgs = [
    "scripts/run-production-command.mjs",
    "node",
    "scripts/run-inapi-sync.mjs",
    "--preset",
    "phase1-10k",
    "--startIndex",
    String(nextStartIndex),
    "--maxJobs",
    String(maxJobs),
    "--delayMs",
    String(delayMs),
  ]

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "launch_next_window",
          dryRun: true,
          nextWindow: {
            startIndex: nextStartIndex,
            maxJobs,
            delayMs,
          },
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
        nextWindow: {
          startIndex: nextStartIndex,
          maxJobs,
          delayMs,
        },
        basedOn: latestPhaseRun,
      },
      null,
      2,
    ),
  )

  await runCommand(process.execPath, commandArgs)
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

    child.on("exit", (code, signal) => {
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

    child.on("error", reject)
  })
}
