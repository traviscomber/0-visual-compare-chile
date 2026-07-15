import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const DEFAULT_DELAY_MS = 400
const DEFAULT_MAX_JOBS = 3
const STALE_RUN_MS = 5 * 60 * 1000
const CONTROL_FILE = path.resolve(process.cwd(), "tmp", "monitor-inapi-window.command.json")
const RESULT_FILE = path.resolve(process.cwd(), "tmp", "monitor-inapi-window.result.json")
const AUTOLOOP_PID_FILE = path.resolve(process.cwd(), "tmp", "inapi-autoloop.pid")
const AUTO_ADVANCE_ENABLED = process.env.MONITOR_AUTO_ADVANCE === "true"

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

let [latestRuns, totalRecords, totals] = await Promise.all([
  selectLatestRuns(),
  countTrademarkRecords(),
  selectRunStatuses(),
])

let activeRuns = selectActiveRuns(latestRuns)
let activeRun = activeRuns[0] ?? null
const staleRecovery = await maybeRecoverStaleRun(activeRun)

if (staleRecovery) {
  ;[latestRuns, totals] = await Promise.all([selectLatestRuns(), selectRunStatuses()])
  activeRuns = selectActiveRuns(latestRuns)
  activeRun = activeRuns[0] ?? null
}

const phaseRuns = latestRuns.filter((run) => run.metadata?.preset === "phase1-10k")
const activePhaseRuns = phaseRuns.filter((run) => run.status === "running")
const phaseFrontierRun = selectPhaseFrontierRun(phaseRuns)
const continueWindow = buildContinueWindow(phaseFrontierRun, activePhaseRuns.length)
const controlResult = handleControlFile({
  activeRun,
  continueWindow,
})

console.log(
  JSON.stringify(
    {
      totalRecords,
      runs: {
        total: totals.length,
        completed: totals.filter((run) => run.status === "completed").length,
        running: totals.filter((run) => run.status === "running").length,
        failed: totals.filter((run) => run.status === "failed").length,
      },
      latestRuns,
      activeRun,
      activePhaseRuns,
      staleRecovery,
      continueWindow,
      controlResult,
    },
    null,
    2,
  ),
)

async function selectLatestRuns() {
  return selectRows("inapi_sync_runs", {
    select:
      "id,status,query,search_type,total_fetched,inserted_count,updated_count,error_message,started_at,finished_at,metadata",
    order: "started_at.desc.nullslast",
    limit: "12",
  })
}

async function selectRunStatuses() {
  return selectRows("inapi_sync_runs", {
    select: "id,status",
    order: "started_at.desc.nullslast",
    limit: "500",
  })
}

async function countTrademarkRecords() {
  const response = await fetch(`${supabaseUrl}/rest/v1/trademark_records?select=id`, {
    method: "HEAD",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "count=exact",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to count trademark_records: ${response.status} ${await response.text()}`)
  }

  const range = response.headers.get("content-range") ?? ""
  const match = range.match(/\/(\d+)$/)
  return match ? Number(match[1]) : 0
}

async function selectRows(table, query) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${table}: ${response.status} ${await response.text()}`)
  }

  const payload = await response.json()
  return Array.isArray(payload) ? payload : []
}

async function updateRows(table, query, payload) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to update ${table}: ${response.status} ${await response.text()}`)
  }

  const responseText = await response.text()
  if (!responseText.trim()) {
    return []
  }

  const rows = JSON.parse(responseText)
  return Array.isArray(rows) ? rows : []
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

async function maybeRecoverStaleRun(run) {
  const staleRun = detectStaleRun(run)
  if (!staleRun) {
    return null
  }

  const recoveryTimestamp = new Date().toISOString()
  const recoveredRows = await updateRows(
    "inapi_sync_runs",
    {
      id: `eq.${run.id}`,
      status: "eq.running",
    },
    {
      status: "failed",
      finished_at: recoveryTimestamp,
      error_message: `Recovered stale run by Codex: no progress heartbeat for ${Math.round(staleRun.idleMs / 1000)}s.`,
      metadata: {
        ...(run.metadata ?? {}),
        staleRecovery: {
          recoveredAt: recoveryTimestamp,
          idleMs: staleRun.idleMs,
          lastActivityAt: staleRun.lastActivityAt,
          processed: staleRun.processed,
          totalFetched: staleRun.totalFetched,
        },
      },
    },
  )

  if (recoveredRows.length === 0) {
    return {
      status: "skipped",
      reason: "run_changed_before_recovery",
      runId: run.id,
      ...staleRun,
    }
  }

  return {
    status: "recovered",
    reason: "stale_heartbeat",
    runId: run.id,
    recoveryTimestamp,
    ...staleRun,
  }
}

function detectStaleRun(run) {
  if (!run || run.status !== "running") {
    return null
  }

  const lastActivityAt = readMetadataString(run.metadata?.progress, "lastActivityAt") ?? run.started_at ?? null
  const lastActivityMs = parseTimestamp(lastActivityAt)
  if (!lastActivityAt || lastActivityMs === null) {
    return null
  }

  const idleMs = Date.now() - lastActivityMs
  if (idleMs < STALE_RUN_MS) {
    return null
  }

  const processed =
    readMetadataNumber(run.metadata?.progress, "processed") ??
    readMetadataNumber(run.metadata, "processed_count", "processedCount")
  const totalFetched = normalizeNumber(run.total_fetched)

  return {
    idleMs,
    lastActivityAt,
    processed,
    totalFetched,
  }
}

function readMetadataString(metadata, ...keys) {
  if (!metadata || typeof metadata !== "object") {
    return null
  }

  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim()) {
      return value
    }
  }

  return null
}

function parseTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

function printUsage() {
  console.log("Usage: node scripts/monitor-inapi-window.mjs")
  console.log("Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
}

function handleControlFile({ activeRun, continueWindow }) {
  if (!fs.existsSync(CONTROL_FILE)) {
    return AUTO_ADVANCE_ENABLED ? launchNextWindow({ activeRun, continueWindow, source: "auto_advance" }) : null
  }

  return handleExplicitControlFile({ activeRun, continueWindow })
}

function handleExplicitControlFile({ activeRun, continueWindow }) {
  if (!fs.existsSync(CONTROL_FILE)) {
    return null
  }

  let command = null
  try {
    command = JSON.parse(fs.readFileSync(CONTROL_FILE, "utf8").replace(/^\uFEFF/, ""))
  } catch (error) {
    const result = {
      action: "unknown",
      status: "failed",
      reason: "invalid_control_file",
      error: String(error),
    }
    writeResultFile(result)
    safeUnlink(CONTROL_FILE)
    return result
  }

  let result = null
  try {
    if (command?.action === "start_autoloop") {
      result = launchAutoloop()
      return result
    }

    if (command?.action !== "advance_next_window") {
      result = {
        action: command?.action ?? "unknown",
        status: "ignored",
        reason: "unsupported_action",
      }
      return result
    }

    result = launchNextWindow({ activeRun, continueWindow, action: command.action, source: "control_file" })
    return result
  } catch (error) {
    result = {
      action: command?.action ?? "advance_next_window",
      status: "failed",
      reason: "launch_exception",
      error: String(error),
    }
    return result
  } finally {
    if (result) {
      writeResultFile(result)
    }
    safeUnlink(CONTROL_FILE)
  }
}

function launchNextWindow({ activeRun, continueWindow, action = "advance_next_window", source }) {
  if (activeRun) {
    return {
      action,
      status: "skipped",
      reason: "active_run_in_progress",
      activeRunId: activeRun.id,
      source,
    }
  }

  if (!continueWindow) {
    return {
      action,
      status: "skipped",
      reason: "missing_reference_window",
      source,
    }
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

  const child = spawn(process.execPath, commandArgs, {
    detached: true,
    env: process.env,
    shell: false,
    stdio: "ignore",
  })
  child.unref()

  return {
    action,
    status: "launched",
    pid: child.pid ?? null,
    source,
    nextWindow: {
      startIndex: continueWindow.startIndex,
      maxJobs: continueWindow.maxJobs,
      delayMs: continueWindow.delayMs,
    },
    command: `${process.execPath} ${commandArgs.join(" ")}`,
  }
}

function launchAutoloop() {
  const existingPid = readExistingAutoloopPid()
  if (existingPid !== null) {
    return {
      action: "start_autoloop",
      status: "skipped",
      reason: "already_running",
      pid: existingPid,
    }
  }

  const child = spawn(process.execPath, ["scripts/run-inapi-autoloop.mjs"], {
    detached: true,
    env: process.env,
    shell: false,
    stdio: "ignore",
  })
  child.unref()

  return {
    action: "start_autoloop",
    status: "launched",
    pid: child.pid ?? null,
    command: `${process.execPath} scripts/run-inapi-autoloop.mjs`,
  }
}

function readExistingAutoloopPid() {
  try {
    const raw = fs.readFileSync(AUTOLOOP_PID_FILE, "utf8").trim()
    const pid = Number(raw)
    if (!Number.isFinite(pid) || pid <= 0) {
      return null
    }

    process.kill(pid, 0)
    return pid
  } catch {
    return null
  }
}

function writeResultFile(result) {
  fs.mkdirSync(path.dirname(RESULT_FILE), { recursive: true })
  fs.writeFileSync(
    RESULT_FILE,
    JSON.stringify({ writtenAt: new Date().toISOString(), ...result }, null, 2),
    "utf8",
  )
}

function safeUnlink(filePath) {
  try {
    fs.unlinkSync(filePath)
  } catch {}
}

function selectActiveRuns(runs) {
  return [...runs]
    .filter((run) => run.status === "running")
    .sort((left, right) => {
      const leftTs = parseTimestamp(left.started_at) ?? 0
      const rightTs = parseTimestamp(right.started_at) ?? 0
      return rightTs - leftTs
    })
}

function selectPhaseFrontierRun(runs) {
  const phaseRuns = runs.filter((run) => run.metadata?.preset === "phase1-10k")
  if (!phaseRuns.length) {
    return null
  }

  return [...phaseRuns].sort(comparePhaseRuns)[0] ?? null
}

function comparePhaseRuns(left, right) {
  const leftStartIndex = readMetadataNumber(left?.metadata, "batch_start_index", "batchStartIndex") ?? -1
  const rightStartIndex = readMetadataNumber(right?.metadata, "batch_start_index", "batchStartIndex") ?? -1
  if (leftStartIndex !== rightStartIndex) {
    return rightStartIndex - leftStartIndex
  }

  const leftPosition = readMetadataNumber(left?.metadata, "position") ?? -1
  const rightPosition = readMetadataNumber(right?.metadata, "position") ?? -1
  if (leftPosition !== rightPosition) {
    return rightPosition - leftPosition
  }

  const leftStartedAt = parseTimestamp(left?.started_at) ?? 0
  const rightStartedAt = parseTimestamp(right?.started_at) ?? 0
  return rightStartedAt - leftStartedAt
}

function buildContinueWindow(referenceRun, activePhaseRunCount = 0) {
  const referenceStartIndex = readMetadataNumber(referenceRun?.metadata, "batch_start_index", "batchStartIndex")
  if (referenceStartIndex === null) {
    return null
  }

  const referenceWindowSize =
    readMetadataNumber(referenceRun?.metadata, "batch_window_size", "batchWindowSize") ?? DEFAULT_MAX_JOBS
  const referenceDelayMs = readMetadataNumber(referenceRun?.metadata, "delayMs") ?? DEFAULT_DELAY_MS
  const totalJobs = readMetadataNumber(referenceRun?.metadata, "total_jobs", "totalJobs")
  const retry = referenceRun?.status === "failed"
  const windowSize = Math.max(referenceWindowSize, 1)
  const windowEndIndexExclusive = referenceStartIndex + windowSize
  const failedPosition = readMetadataNumber(referenceRun?.metadata, "position")
  const retryStartIndex = retry && failedPosition !== null
    ? Math.max(failedPosition - 1, referenceStartIndex)
    : referenceStartIndex
  const safeRetryStartIndex = Math.min(retryStartIndex, windowEndIndexExclusive - 1)
  const startIndex = retry
    ? safeRetryStartIndex
    : Math.max(referenceStartIndex + windowSize, 0)
  const maxJobs = retry
    ? Math.max(windowEndIndexExclusive - safeRetryStartIndex, 1)
    : windowSize

  if (!retry && totalJobs !== null && startIndex >= totalJobs) {
    return null
  }

  return {
    safeWhen:
      activePhaseRunCount > 0
        ? activePhaseRunCount > 1
          ? "after_all_active_phase_runs_finish"
          : "after_active_run_finishes"
        : retry
          ? "now_retry_failed_window"
          : "now",
    startIndex,
    maxJobs,
    delayMs: referenceDelayMs,
    retry,
    command: `pnpm sync:inapi:prod -- --preset phase1-10k --startIndex ${startIndex} --maxJobs ${maxJobs} --delayMs ${referenceDelayMs}`,
  }
}
