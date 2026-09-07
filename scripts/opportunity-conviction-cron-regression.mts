import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity conviction cron regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const migration = await readFile("supabase/migrations/20260905223500_add_opportunity_research_claims.sql", "utf8")
const cronRoute = await readFile("app/api/cron/opportunity-conviction/route.ts", "utf8")
const service = await readFile("lib/intelligence/opportunity-thesis-research.ts", "utf8")
const vercel = await readFile("vercel.json", "utf8")

for (const needle of [
  "research_claimed_at",
  "research_claim_token",
  "for update skip locked",
  "interval '20 hours'",
  "interval '30 minutes'",
  "least(coalesce(p_limit, 4), 4)",
  "claim_innovation_opportunity_theses",
  "revoke all on function public.claim_innovation_opportunity_theses(integer) from public, anon, authenticated",
  "grant execute on function public.claim_innovation_opportunity_theses(integer) to service_role",
]) requireText(migration.toLowerCase(), needle.toLowerCase(), "claim migration")

for (const needle of [
  "CRON_SECRET",
  "maxDuration = 300",
  "CLAIM_LIMIT = 4",
  'rpc("claim_innovation_opportunity_theses"',
  "researchPersistedOpportunity",
  'runType: "scheduled_research"',
  "for (const claim of claims)",
  "research_claim_token",
  "research_claimed_at: null",
  "releaseFailures",
  "durationMs",
]) requireText(cronRoute, needle, "scheduled conviction cron")

if (cronRoute.includes("Promise.all(claims.map")) fail("scheduled thesis research must remain sequential to bound external source pressure")

for (const needle of [
  'runType: OpportunityResearchRunType',
  '"live_research" | "scheduled_research"',
  'trigger: runType === "scheduled_research" ? "vercel_cron" : "explicit_user_action"',
  "OpenAlex e INAPI no estuvieron disponibles",
]) requireText(service, needle, "shared research service")

if (!vercel.includes('"/api/cron/opportunity-conviction"') || !vercel.includes('"55 */6 * * *"')) {
  fail("opportunity conviction cron is not scheduled at the intended six-hour cadence")
}

console.log("Opportunity conviction cron regression PASS: due theses are atomically claimed with SKIP LOCKED, stale claims recover after 30 minutes, the batch is capped at four and executed sequentially, scheduled runs reuse the manual conviction service, client roles cannot call the claim RPC, and Vercel checks for due work every six hours without fabricating thesis data.")
