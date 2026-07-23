import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { loadProductionEnv } from "./production-env.mjs"

const PID_FILE = path.resolve(process.cwd(), "tmp", "inapi-autoloop.pid")
const LOG_FILE = path.resolve(process.cwd(), "tmp", "inapi-autoloop.log")
const POLL_MS = 15 * 1000

loadProductionEnv()
writePidFile()
writeLog(`autoloop started pid=${process.pid}`)

let keepRunning = true
process.on("SIGINT", handleStop)
process.on("SIGTERM", handleStop)

while (keepRunning) {
  try {
    const monitorState = await runMonitorTick()
    if (monitorState) {
      const activeRun = monitorState.activeRun
      if (activeRun) {
        const progress = activeRun.metadata?.progress ?? {}
        writeLog(
          `active query=${activeRun.query} batchStartIndex=${activeRun.metadata?.batchStartIndex ?? "unknown"} processed=${progress.processed ?? 0} inserted=${activeRun.inserted_count ?? 0} updated=${activeRun.updated_count ?? 0}`,
        )
      } else if (monitorState.continueWindow) {
        writeLog(
          `pending retry startIndex=${monitorState.continueWindow.startIndex} maxJobs=${monitorState.continueWindow.maxJobs} safeWhen=${monitorState.continueWindow.safeWhen}`,
        )
      } else {
        writeLog("no_active_run no_continue_window")
        break
      }
    }
  } catch (error) {
    writeLog(`fatal ${error.stack ?? error.message}`)
  }

  if (!keepRunning) {
    break
  }

  await sleep(POLL_MS)
}

safeUnlink(PID_FILE)
writeLog("autoloop stopped")

function handleStop() {
  keepRunning = false
}

function writePidFile() {
  fs.mkdirSync(path.dirname(PID_FILE), { recursive: true })
  fs.writeFileSync(PID_FILE, String(process.pid), "utf8")
}

async function runMonitorTick() {
  const output = await runNodeCommand([
    "scripts/run-production-command.mjs",
    "node",
    "scripts/monitor-inapi-window.mjs",
  ])

  if (output.exitCode !== 0) {
    throw new Error(`monitor exited with code ${output.exitCode}: ${output.stderr || output.stdout}`)
  }

  const jsonText = extractJsonObject(output.stdout)
  if (!jsonText) {
    throw new Error(`monitor did not return JSON. stdout=${output.stdout} stderr=${output.stderr}`)
  }

  return JSON.parse(jsonText)
}

function runNodeCommand(commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, commandArgs, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        MONITOR_AUTO_ADVANCE: "true",
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString("utf8")
    })

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString("utf8")
    })

    child.on("error", reject)
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`child exited with signal ${signal}`))
        return
      }

      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      })
    })
  })
}

function extractJsonObject(text) {
  const trimmed = text.trim()
  const startIndex = trimmed.indexOf("{")
  const endIndex = trimmed.lastIndexOf("}")
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return null
  }

  return trimmed.slice(startIndex, endIndex + 1)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function writeLog(message) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`)
}

function safeUnlink(filePath) {
  try {
    fs.unlinkSync(filePath)
  } catch {}
}
