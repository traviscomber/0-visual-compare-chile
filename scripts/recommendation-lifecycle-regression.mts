import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Recommendation lifecycle regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const migration = await readFile("supabase/migrations/20260831111500_add_recommendation_lifecycle.sql", "utf8")
const collectionRoute = await readFile("app/api/intelligence/recommendations/route.ts", "utf8")
const transitionRoute = await readFile("app/api/intelligence/recommendations/[id]/route.ts", "utf8")
const actionRoute = await readFile("app/api/intelligence/recommendations/[id]/action/route.ts", "utf8")
const lifecycle = await readFile("lib/intelligence/recommendation-lifecycle.ts", "utf8")

for (const needle of [
  "create table public.intelligence_recommendations",
  "unique (organization_id, dedupe_key)",
  "status in ('new', 'reviewed', 'accepted', 'discarded', 'converted_to_action')",
  "length(btrim(discard_reason)) >= 5",
  "status = 'converted_to_action' and case_id is not null and action_id is not null",
  "enable row level security",
  "revoke all on table public.intelligence_recommendations from anon, authenticated",
  "to service_role",
]) requireText(migration, needle, "recommendation migration")

for (const needle of [
  "requireUser()",
  "assertPortfolioOrganizationAccess",
  "buildPortfolioGap",
  "portfolioGapRecommendationKey",
  "isTerminalRecommendationStatus",
  '.from("intelligence_recommendations")',
  "Esta señal ya no cumple el umbral",
]) requireText(collectionRoute, needle, "recommendation collection API")

for (const forbidden of ["score:", "headline:", "recommendedAction:", "evidence:"]) {
  const schemaStart = collectionRoute.indexOf("const CreateSchema")
  const schemaEnd = collectionRoute.indexOf("const ListSchema")
  if (schemaStart >= 0 && schemaEnd > schemaStart && collectionRoute.slice(schemaStart, schemaEnd).includes(forbidden)) {
    fail(`client create schema must not accept computed recommendation field ${forbidden}`)
  }
}

for (const needle of [
  'z.enum(["reviewed", "accepted", "discarded"])',
  "body.data.reason?.length",
  'currentStatus === "new"',
  'currentStatus === "reviewed"',
  'nextStatus === "accepted"',
  'nextStatus === "discarded"',
  '.eq("status", currentStatus)',
]) requireText(transitionRoute, needle, "recommendation transition API")

for (const needle of [
  'recommendation.status !== "accepted"',
  'auth.supabase.rpc("create_intelligence_action"',
  'p_source_id: sourceId',
  '`recommendation:${recommendation.id}`',
  'status: "converted_to_action"',
  "converted_by",
  "case_id: row.case_id",
  "action_id: row.action_id",
]) requireText(actionRoute, needle, "recommendation action conversion")

if (actionRoute.includes('admin.rpc("create_intelligence_action"')) fail("action conversion must execute the action RPC as the authenticated user")
if (!lifecycle.includes("portfolio-gap:${ownIdentityId}:${competitorIdentityId}:${assetType}:${code.trim()}")) fail("portfolio-gap recommendation dedupe key is not stable")

console.log("Recommendation lifecycle regression PASS: server-recomputed recommendations are deduplicated per organization, require human review before acceptance, require rationale to discard, and convert accepted recommendations into attributable case work.")
