import fs from "node:fs"
import path from "node:path"

const DEFAULT_ENV_FILE = ".env.vercel.production"

export function loadProductionEnv(envFile = DEFAULT_ENV_FILE) {
  const resolvedPath = path.resolve(process.cwd(), envFile)
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Missing production env file: ${resolvedPath}`)
  }

  const raw = fs.readFileSync(resolvedPath, "utf8")
  const parsed = parseDotEnv(raw)

  applyEnv(parsed)
  applyFallback("NEXT_PUBLIC_SUPABASE_URL", parsed, ["SUPABASE_URL_2", "SUPABASE_URL_3"])
  applyFallback("SUPABASE_SERVICE_ROLE_KEY", parsed, ["SUPABASE_SERVICE_ROLE_KEY_2", "SUPABASE_SERVICE_ROLE_KEY_3"])
  applyFallback("POSTGRES_URL", parsed, [
    "POSTGRES_URL_4",
    "POSTGRES_URL_5",
    "POSTGRES_URL_6",
    "POSTGRES_URL_7",
    "POSTGRES_URL_8",
    "POSTGRES_URL_2",
    "POSTGRES_URL_3",
  ])

  return {
    envFile: resolvedPath,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
  }
}

function parseDotEnv(raw) {
  const env = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

function applyEnv(parsed) {
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value
  }
}

function applyFallback(targetKey, parsed, candidates) {
  const current = process.env[targetKey]?.trim()
  if (current) return

  for (const candidate of candidates) {
    const value = parsed[candidate]?.trim()
    if (value) {
      process.env[targetKey] = value
      return
    }
  }
}
