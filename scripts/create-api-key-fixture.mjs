import crypto from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const args = parseArgs(process.argv.slice(2))

if (args.help === "true") {
  printUsage()
  process.exit(0)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const organizationId = args.organizationId ?? process.env.FIXTURE_ORGANIZATION_ID
const userId = args.userId ?? process.env.FIXTURE_USER_ID ?? organizationId
const name = args.name ?? process.env.FIXTURE_KEY_NAME ?? "phase1-quota-fixture"
const quotaDaily = Number.isFinite(Number(args.quotaDaily ?? process.env.FIXTURE_QUOTA_DAILY))
  ? Math.max(1, Math.floor(Number(args.quotaDaily ?? process.env.FIXTURE_QUOTA_DAILY)))
  : 2
const quotaMonthly = Number.isFinite(Number(args.quotaMonthly ?? process.env.FIXTURE_QUOTA_MONTHLY))
  ? Math.max(quotaDaily, Math.floor(Number(args.quotaMonthly ?? process.env.FIXTURE_QUOTA_MONTHLY)))
  : 10
const expiresInDays = Number.isFinite(Number(args.expiresInDays ?? process.env.FIXTURE_EXPIRES_IN_DAYS))
  ? Math.max(1, Math.floor(Number(args.expiresInDays ?? process.env.FIXTURE_EXPIRES_IN_DAYS)))
  : 7

if (!supabaseUrl || !serviceKey) {
  printUsage()
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

if (!organizationId) {
  printUsage()
  console.error("Missing organizationId. Use --organizationId or FIXTURE_ORGANIZATION_ID.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const apiKey = generateApiKey()
const keyHash = hashApiKey(apiKey)
const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

const { data, error } = await supabase
  .from("api_keys")
  .insert({
    organization_id: organizationId,
    user_id: userId,
    key_hash: keyHash,
    name,
    is_active: true,
    expires_at: expiresAt,
    quota_daily: quotaDaily,
    quota_monthly: quotaMonthly,
  })
  .select("id, organization_id, user_id, name, quota_daily, quota_monthly, expires_at, created_at")
  .single()

if (error || !data) {
  console.error(error ?? "Failed to create API key fixture")
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      id: data.id,
      organization_id: data.organization_id,
      user_id: data.user_id,
      name: data.name,
      quota_daily: data.quota_daily,
      quota_monthly: data.quota_monthly,
      expires_at: data.expires_at,
      created_at: data.created_at,
      api_key: apiKey,
    },
    null,
    2,
  ),
)

function generateApiKey() {
  return `sc_${crypto.randomBytes(32).toString("hex")}`
}

function hashApiKey(value) {
  return crypto.createHash("sha256").update(value).digest("hex")
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
  console.log("Usage: node scripts/create-api-key-fixture.mjs --organizationId <uuid> [--userId <uuid>] [--name phase1-quota-fixture] [--quotaDaily 2] [--quotaMonthly 10] [--expiresInDays 7]")
  console.log("Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  console.log("Env fallback: FIXTURE_ORGANIZATION_ID, FIXTURE_USER_ID, FIXTURE_KEY_NAME, FIXTURE_QUOTA_DAILY, FIXTURE_QUOTA_MONTHLY, FIXTURE_EXPIRES_IN_DAYS")
}
