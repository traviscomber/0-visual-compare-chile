import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const args = parseArgs(process.argv.slice(2))
const includeBuild = args.includeBuild !== "false"
const jsonOut = args.jsonOut ?? "./artifacts/phase1-gate.json"
const checks = []
let generatedQuotaFixture = null

if (args.help === "true") {
  printUsage()
  process.exit(0)
}

await runCheck("TypeScript", [process.execPath, ["./node_modules/typescript/bin/tsc", "-p", "tsconfig.json", "--noEmit"]], {
  required: true,
})

if (includeBuild) {
  await runCheck("Next build", [process.execPath, ["./node_modules/next/dist/bin/next", "build"]], {
    required: true,
  })
}

await runCheck("INAPI evidence", [process.execPath, ["./scripts/inapi-sync-evidence.mjs"]], {
  required: false,
  isConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  missingHint: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
})

await runQuotaVerification()

printSummary()
await writeJsonReport()

const failedRequired = checks.filter((check) => check.required && check.status === "failed")
if (failedRequired.length > 0) {
  process.exit(1)
}

function runCommand(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      env: {
        ...process.env,
        ...extraEnv,
      },
    })

    child.on("error", reject)
    child.on("exit", (code) => resolve(code ?? 1))
  })
}

function runCommandCapture(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    let stdout = ""
    let stderr = ""
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        ...extraEnv,
      },
    })

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString()
      stdout += text
      process.stdout.write(text)
    })

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString()
      stderr += text
      process.stderr.write(text)
    })

    child.on("error", reject)
    child.on("exit", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      })
    })
  })
}

async function runCheck(name, [command, commandArgs], options) {
  const required = options.required === true
  const isConfigured = options.isConfigured ?? true

  if (!isConfigured) {
    checks.push({
      name,
      required,
      status: "skipped",
      detail: options.missingHint ?? "Missing configuration",
    })
    return
  }

  console.log(`\n[phase1-gate] Running ${name}...`)
  const exitCode = await runCommand(command, commandArgs)
  checks.push({
    name,
    required,
    status: exitCode === 0 ? "passed" : "failed",
    detail: exitCode === 0 ? "ok" : `exit=${exitCode}`,
  })
}

async function runQuotaVerification() {
  const hasDirectKey = Boolean(process.env.QUOTA_VERIFY_API_KEY)
  const canCreateFixture = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.FIXTURE_ORGANIZATION_ID,
  )

  if (!hasDirectKey && !canCreateFixture) {
    checks.push({
      name: "Quota verification",
      required: false,
      status: "skipped",
      detail:
        "Set QUOTA_VERIFY_API_KEY or provide NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and FIXTURE_ORGANIZATION_ID",
    })
    return
  }

  let quotaEnv = {}
  let detailSuffix = ""

  if (!hasDirectKey && canCreateFixture) {
    console.log("\n[phase1-gate] Creating quota fixture API key...")
    const fixtureResult = await runCommandCapture(process.execPath, ["./scripts/create-api-key-fixture.mjs"])
    if (fixtureResult.code !== 0) {
      checks.push({
        name: "Quota fixture creation",
        required: false,
        status: "failed",
        detail: `exit=${fixtureResult.code}`,
      })
      return
    }

    const fixturePayload = tryParseJsonObject(fixtureResult.stdout)
    if (!fixturePayload?.api_key) {
      checks.push({
        name: "Quota fixture creation",
        required: false,
        status: "failed",
        detail: "No api_key found in fixture output",
      })
      return
    }

    generatedQuotaFixture = {
      id: fixturePayload.id ?? null,
      name: fixturePayload.name ?? null,
      quota_daily: fixturePayload.quota_daily ?? null,
      quota_monthly: fixturePayload.quota_monthly ?? null,
    }
    quotaEnv = { QUOTA_VERIFY_API_KEY: fixturePayload.api_key }
    detailSuffix = " via generated fixture"
  }

  console.log(`\n[phase1-gate] Running Quota verification${detailSuffix}...`)
  const result = await runCommand(process.execPath, ["./scripts/verify-api-quota.mjs"], quotaEnv)
  checks.push({
    name: "Quota verification",
    required: false,
    status: result === 0 ? "passed" : "failed",
    detail: result === 0 ? `ok${detailSuffix}` : `exit=${result}${detailSuffix}`,
  })
}

function printSummary() {
  console.log("\n[phase1-gate] Summary")
  for (const check of checks) {
    const prefix =
      check.status === "passed" ? "PASS" : check.status === "failed" ? "FAIL" : "SKIP"
    console.log(`${prefix} ${check.name}${check.required ? " [required]" : " [optional]"} - ${check.detail}`)
  }
}

async function writeJsonReport() {
  const targetPath = path.resolve(process.cwd(), jsonOut)
  await mkdir(path.dirname(targetPath), { recursive: true })

  const payload = {
    generatedAt: new Date().toISOString(),
    includeBuild,
    checks,
    generatedQuotaFixture,
  }

  await writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  console.log(`[phase1-gate] Report written to ${targetPath}`)
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
  console.log("Usage: node scripts/phase1-gate.mjs [--includeBuild true|false] [--jsonOut ./artifacts/phase1-gate.json]")
  console.log("Required checks: TypeScript, Next build")
  console.log("Optional checks:")
  console.log("- INAPI evidence: requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  console.log("- Quota verification: uses QUOTA_VERIFY_API_KEY directly, or auto-creates a fixture when NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and FIXTURE_ORGANIZATION_ID are present")
}

function tryParseJsonObject(value) {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}\s*$/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}
