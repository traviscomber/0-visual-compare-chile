import { spawn } from "node:child_process"
import { loadProductionEnv } from "./production-env.mjs"

const [, , ...args] = process.argv

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

const child = spawn(resolvedCommand, commandArgs, {
  stdio: "inherit",
  env: process.env,
  shell: false,
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
