import { readFile } from "node:fs/promises"

type BenchmarkCase = {
  left: string
  right: string
  expectedMatch: boolean
  reason: string
}

type Benchmark = {
  name: string
  source: string
  policy: string
  cases: BenchmarkCase[]
}

const benchmark = JSON.parse(
  await readFile("benchmarks/company-identity-v1.json", "utf8"),
) as Benchmark

let tp = 0
let fp = 0
let fn = 0
let tn = 0
const misses: Array<{ type: "FP" | "FN"; left: string; right: string; reason: string }> = []

for (const item of benchmark.cases) {
  const predictedMatch = normalizeCompanyIdentity(item.left) === normalizeCompanyIdentity(item.right)
  if (predictedMatch && item.expectedMatch) tp += 1
  else if (predictedMatch && !item.expectedMatch) {
    fp += 1
    misses.push({ type: "FP", left: item.left, right: item.right, reason: item.reason })
  } else if (!predictedMatch && item.expectedMatch) {
    fn += 1
    misses.push({ type: "FN", left: item.left, right: item.right, reason: item.reason })
  } else tn += 1
}

const precision = tp + fp ? tp / (tp + fp) : 1
const recall = tp + fn ? tp / (tp + fn) : 1
const accuracy = (tp + tn) / benchmark.cases.length

const result = {
  benchmark: benchmark.name,
  cases: benchmark.cases.length,
  tp,
  fp,
  fn,
  tn,
  precision: round(precision),
  recall: round(recall),
  accuracy: round(accuracy),
  misses,
}

console.log(JSON.stringify(result, null, 2))

// Grade A non-regression floor. Precision is intentionally strict because false
// corporate merges are more damaging than leaving an ambiguous alias for review.
if (precision < 1) {
  console.error(`Company identity benchmark FAIL: precision ${precision.toFixed(3)} < 1.000`)
  process.exit(1)
}
if (recall < 0.9) {
  console.error(`Company identity benchmark FAIL: recall ${recall.toFixed(3)} < 0.900`)
  process.exit(1)
}

for (const policyCase of [
  { method: "normalized_exact", confidence: 0.9, country: "CL", expected: true },
  { method: "normalized_exact", confidence: 0.8, country: "CL", expected: false },
  { method: "normalized_exact", confidence: 0.9, country: null, expected: false },
  { method: "fuzzy", confidence: 0.99, country: "CL", expected: false },
]) {
  const actual = autoLinkAllowed(policyCase.method, policyCase.confidence, policyCase.country)
  if (actual !== policyCase.expected) {
    console.error(`Company identity benchmark FAIL: auto-link policy mismatch for ${JSON.stringify(policyCase)}`)
    process.exit(1)
  }
}

const policyMigration = await readFile("supabase/migrations/20260830233738_enforce_company_identity_autolink_policy.sql", "utf8")
for (const needle of [
  "company_identity_auto_link_allowed",
  "p_confidence >= 0.900",
  "review_required",
  "missing_country_context",
  "'*:' || a.identity_key",
  "intelligence_company_identity_reviews",
]) requireText(policyMigration, needle, "policy migration")

const feedbackMigration = await readFile("supabase/migrations/20260830233954_add_intelligence_feedback_audit.sql", "utf8")
for (const needle of [
  "intelligence_feedback",
  "intelligence_feedback_audit",
  "relevant",
  "irrelevant",
  "false_match",
  "identity_incorrect",
  "target_not_found",
]) requireText(feedbackMigration, needle, "feedback migration")

const feedbackHardening = await readFile("supabase/migrations/20260830234359_harden_intelligence_feedback_rpc.sql", "utf8")
for (const needle of [
  "security invoker",
  "p_user_id uuid",
  "e.user_id = p_user_id",
  "grant execute on function public.submit_intelligence_feedback(uuid,text,text,text,text,jsonb) to service_role",
  "revoke all on function public.submit_intelligence_feedback(uuid,text,text,text,text,jsonb) from public, anon, authenticated",
]) requireText(feedbackHardening, needle, "feedback hardening")

const feedbackRoute = await readFile("app/api/intelligence/feedback/route.ts", "utf8")
for (const needle of [
  "requireUser()",
  "PRIVATE_NO_STORE_HEADERS",
  "createAdminClient",
  "submit_intelligence_feedback",
  "p_user_id: auth.user.id",
]) requireText(feedbackRoute, needle, "feedback API")

const calibrationPage = await readFile("app/(app)/monitorear/estrategico/calibrar/page.tsx", "utf8")
for (const needle of [
  "Relevante",
  "Irrelevante",
  "Falso match",
  "Identidad incorrecta",
  "/api/intelligence/feedback",
  "El feedback no elimina la evidencia ni cambia su fuente",
]) requireText(calibrationPage, needle, "calibration workspace")

const operationsMigration = await readFile("supabase/migrations/20260830234844_add_audited_company_identity_operations.sql", "utf8")
for (const needle of [
  "intelligence_company_identity_operations",
  "merge_company_identities_manual",
  "split_company_alias_manual",
  "source_has_portfolio_binding",
  "source_has_corporate_relationships",
  "before_snapshot",
  "after_snapshot",
  "grant execute on function public.merge_company_identities_manual(uuid,uuid,uuid,text) to service_role",
]) requireText(operationsMigration, needle, "identity operations")

const calibrationMigration = await readFile("supabase/migrations/20260830235024_add_intelligence_calibration_snapshots.sql", "utf8")
for (const needle of [
  "intelligence_calibration_snapshots",
  "insufficient_sample",
  "minimum_sample",
  "review_acceptance_not_model_precision",
  "false_positive_rate",
  "by_source",
  "by_event_type",
]) requireText(calibrationMigration, needle, "calibration snapshots")

const healthCron = await readFile("app/api/cron/intelligence-health/route.ts", "utf8")
for (const needle of [
  "run_intelligence_health_sweep",
  "run_intelligence_calibration_snapshot",
  "Promise.all",
]) requireText(healthCron, needle, "health/calibration cron")

console.log("Company identity benchmark PASS")

function normalizeCompanyIdentity(value: string) {
  let normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/^\s*\([A-Z]{2}\)\s*/, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()

  normalized = normalized.replace(/^(S A C I|SACI|S A I C|SAIC)\s+/, "")
  normalized = normalized.replace(
    /(?:\s+(?:S A|SA|S P A|SPA|LTDA|LIMITADA|INC|LLC|LTD|LIMITED|CO LTD|CORP|CORPORATION|GMBH|SAS|N V|NV|AG|PLC|PTE LTD|S A C I|SACI|S A I C|SAIC|S A C I COMERCIANTE))+$/,
    "",
  ).trim()

  return normalized
}

function autoLinkAllowed(method: string, confidence: number, country: string | null) {
  return method.trim().toLowerCase() === "normalized_exact"
    && confidence >= 0.9
    && Boolean(country?.trim())
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) {
    console.error(`Company identity benchmark FAIL: ${label} missing ${needle}`)
    process.exit(1)
  }
}

function round(value: number) {
  return Math.round(value * 1000) / 1000
}
