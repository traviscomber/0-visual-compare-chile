import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { loadProductionEnv } from "./production-env.mjs"

const [, , ...args] = process.argv
const LOG_FILE = path.resolve(process.cwd(), "tmp", "run-production-command.log")

if (args.length === 0) {
  console.error("Usage: node scripts/run-production-command.mjs <command> [...args]")
  process.exit(1)
}

const envInfo = loadProductionEnv()

if (!envInfo.supabaseUrl || !envInfo.hasServiceRoleKey) {
  console.error("Production env loaded, but canonical Supabase variables are still missing.")
  process.exit(1)
}

const [command, ...commandArgs] = args
const resolvedCommand = command === "node" ? process.execPath : command

writeLog(
  `start pid=${process.pid} command=${resolvedCommand} args=${JSON.stringify(commandArgs)} envFile=${envInfo.envFile} hasSupabaseUrl=${Boolean(envInfo.supabaseUrl)} hasServiceRoleKey=${envInfo.hasServiceRoleKey} hasPostgresUrl=${envInfo.hasPostgresUrl}`,
)

const child = spawn(resolvedCommand, commandArgs, {
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
  shell: false,
})

writeLog(`spawned child pid=${child.pid ?? "unknown"}`)

child.stdout?.on("data", (chunk) => {
  process.stdout.write(chunk)
  writeChunk("stdout", chunk)
})

child.stderr?.on("data", (chunk) => {
  process.stderr.write(chunk)
  writeChunk("stderr", chunk)
})

child.on("exit", (code, signal) => {
  writeLog(`exit code=${code ?? "null"} signal=${signal ?? "null"}`)
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})

child.on("error", (error) => {
  writeLog(`child_error ${error.stack ?? error.message}`)
  process.exit(1)
})

function writeLog(message) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`)
}

function writeChunk(stream, chunk) {
  const text = typeof chunk === "string" ? chunk : chunk.toString("utf8")
  const normalized = text.endsWith("\n") ? text : `${text}\n`
  writeLog(`[${stream}] ${normalized.trimEnd()}`)
}
