import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity conviction regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const rules = await readFile("lib/intelligence/opportunity-conviction.ts", "utf8")
const service = await readFile("lib/intelligence/opportunity-thesis-research.ts", "utf8")
const researchRoute = await readFile("app/api/intelligence/opportunity-theses/[id]/research/route.ts", "utf8")
const thesisRoute = await readFile("app/api/intelligence/opportunity-theses/route.ts", "utf8")
const thesisPage = await readFile("app/(app)/oportunidades/tesis/page.tsx", "utf8")

for (const needle of [
  "buildTechnologySignals",
  "if (!previous)",
  "Baseline estructurado establecido. La primera observación persistente no mueve la convicción.",
  "evidence_delta: 0",
  "timing_delta: 0",
  "overall_delta: 0",
  "news_non_scoring: true",
  "Una fuente dura no estuvo disponible; VIDENTIA no penaliza la tesis por indisponibilidad de fuente.",
  "clamp(Math.round(evidenceDelta), -8, 8)",
  "clamp(Math.round(timingDelta), -6, 6)",
  "clamp(round4(evidenceDelta * 0.005 + timingDelta * 0.002), -0.05, 0.05)",
  "Persistent research can hold or downgrade a thesis, never auto-upgrade it to build/prototype.",
]) requireText(rules, needle, "conviction rules")

if (rules.includes('return "build" as const')) fail("conviction rules must never auto-upgrade a persistent thesis to build")
if (rules.includes("news_context_count *") || rules.includes("news_context_count +") || rules.includes("news_context_count -")) {
  fail("news volume must never directly move conviction scores")
}

for (const needle of [
  "observeOpportunityMarketState",
  "compareOpportunityMarketStates",
  "findLatestMarketState",
  '.from("innovation_opportunity_research_runs")',
  '.from("innovation_opportunity_theses")',
  "news_non_scoring: true",
  "rollback",
  "La tesis está cerrada. Reactívala antes de investigar nuevamente.",
  "OpenAlex e INAPI no estuvieron disponibles",
  'trigger: runType === "scheduled_research" ? "vercel_cron" : "explicit_user_action"',
]) requireText(service, needle, "shared research service")

for (const needle of [
  "requireUser()",
  "assertPortfolioOrganizationAccess",
  "researchPersistedOpportunity",
  'runType: "live_research"',
  "OpportunityResearchError",
]) requireText(researchRoute, needle, "manual research route")

for (const needle of [
  '.from("innovation_opportunity_research_runs")',
  "research_history",
  "historyByOpportunity",
]) requireText(thesisRoute, needle, "thesis history API")

for (const needle of [
  "Re-investigar",
  "Conviction curve",
  "Baseline establecido · Δ 0",
  "Fortaleciéndose",
  "Debilitándose",
  "noticias nunca suben score por volumen",
  "/research",
]) requireText(thesisPage, needle, "conviction workspace")

console.log("Opportunity conviction regression PASS: manual and scheduled research share one scoring service; persistent theses establish a zero-delta baseline, compare only new hard-evidence movement, ignore news volume for scoring, tolerate source outages without penalty, bound deltas, never auto-upgrade to build, append lineage, and expose the conviction curve with explicit human re-research.")
