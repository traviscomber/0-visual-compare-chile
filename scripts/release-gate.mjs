import { spawn } from "node:child_process"

const required = [
  "ACTIVE_DEPLOYMENT_URL",
  "EXPECTED_REVISION",
  "EXPECTED_SUPABASE_PROJECT_REF",
  "EXPECTED_SITE_ORIGIN",
  "EXPECTED_CALLBACK_URL",
]

const optional = ["CANONICAL_DEPLOYMENT_URL"]

const missing = required.filter((name) => !process.env[name] || process.env[name].trim() === "")

if (missing.length > 0) {
  console.error("Missing required environment variables for release gate:")
  for (const name of missing) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

function runNodeScript(scriptPath, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: "inherit",
      env: {
        ...process.env,
        ...extraEnv,
      },
    })

    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined)
        return
      }

      reject(new Error(`${scriptPath} failed with exit code ${code ?? "unknown"}`))
    })
  })
}

async function main() {
  console.log("Release gate step 1/2: smoke against active deployment")
  await runNodeScript(new URL("./smoke-check.mjs", import.meta.url), {
    SMOKE_BASE_URL: process.env.ACTIVE_DEPLOYMENT_URL,
  })

  console.log("Release gate step 2/2: deploy audit against active and canonical domains")
  await runNodeScript(new URL("./audit-deployment.mjs", import.meta.url))

  console.log("Release gate passed.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
