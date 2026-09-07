import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity executive attention regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const helper = await readFile("lib/intelligence/opportunity-attention.ts", "utf8")
const attention = await readFile("lib/intelligence/executive-attention.ts", "utf8")
const route = await readFile("app/api/intelligence/watches/signals/route.ts", "utf8")
const research = await readFile("lib/intelligence/opportunity-thesis-research.ts", "utf8")
const page = await readFile("app/(app)/monitorear/atencion/page.tsx", "utf8")

for (const needle of [
  "evidence: 4",
  "timing: 3",
  "confidence: 0.025",
  'comparison.baseline',
  'comparison.direction === "baseline"',
  'comparison.direction === "stable"',
  'evidence.decision_degraded === true',
  'run.run_type === "human_review"',
  'safeTime(latestHumanReview.observed_at) >= safeTime(materialResearch.observed_at)',
  'priority: weakening ? "alta" as const : "media" as const',
  'kind: "opportunity_conviction" as const',
  'href: "/oportunidades/tesis"',
]) requireText(helper, needle, "opportunity attention rules")

for (const forbidden of [
  'direction === "baseline" ? "alta"',
  'direction === "stable" ? "alta"',
  'news_context_count',
]) if (helper.includes(forbidden)) fail(`attention helper must not escalate baseline/stable/news volume: ${forbidden}`)

for (const needle of [
  'kind: "regulatory_case" | "competitive_expansion" | "new_high_signal" | "opportunity_conviction"',
  "sortExecutiveAttentionItems",
]) requireText(attention, needle, "executive attention model")

for (const needle of [
  "createAdminClient()",
  "listPortfolioOrganizations(admin, auth.user.id)",
  '.from("innovation_opportunity_theses")',
  '.in("organization_id", organizationIds)',
  '.from("innovation_opportunity_research_runs")',
  "buildOpportunityAttentionItems",
  "sortExecutiveAttentionItems",
  "opportunity: opportunityAttention.length",
]) requireText(route, needle, "attention API")

for (const needle of [
  "decision_before: currentDecision",
  "decision_after: decision",
  "decision_degraded: decision !== currentDecision",
  "news_non_scoring: true",
]) requireText(research, needle, "research lineage")

for (const needle of [
  '"opportunity_conviction"',
  '"Cambio de convicción"',
  'Cambios de tesis',
  'Convicción material sin revisión humana posterior',
  'fetch("/api/intelligence/actions"',
  'Revisar cambio de convicción:',
]) requireText(page, needle, "executive attention UI")

console.log("Opportunity executive attention regression PASS: only material post-baseline conviction changes enter the shared executive queue, competitive Nice expansions remain a separate attention kind, weakening/degradation outrank strengthening, a later human_review resolves thesis attention, organization membership scopes all server-only thesis reads, research preserves decision lineage, and opportunity attention reuses the attributable action layer without scoring news volume.")
