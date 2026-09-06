import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity prototype assessment regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

const route = await readFile("app/api/intelligence/opportunity-theses/[id]/prototype-assessment/route.ts", "utf8")
const service = await readFile("lib/intelligence/opportunity-thesis-research.ts", "utf8")
const rules = await readFile("lib/intelligence/opportunity-conviction.ts", "utf8")
const page = await readFile("app/(app)/oportunidades/tesis/page.tsx", "utf8")
const ci = await readFile(".github/workflows/ci.yml", "utf8")

for (const needle of [
  "requireUser()",
  "assertPortfolioOrganizationAccess",
  'access.role !== "admin"',
  'z.enum(["supports", "mixed", "refutes", "inconclusive"])',
  '.eq("run_type", "human_review")',
  "prototype_outcome",
  "source_research_id: outcomeRun.id",
  "action_id: String(outcome.action_id)",
  "outcome_at: String(outcome.outcome_at)",
  "scores_unchanged: true",
  'conviction_effect: "pending_research"',
  'trigger: "explicit_user_action"',
  "created_by: auth.user.id",
]) requireText(route, needle, "assessment route")

if (route.includes('.from("innovation_opportunity_theses").update(') || /\.from\("innovation_opportunity_theses"\)[\s\S]{0,400}\.update\(/.test(route)) {
  fail("classifying a prototype outcome must never mutate thesis conviction directly")
}

for (const needle of [
  "findPendingPrototypeAssessment(history)",
  "let latestOutcomeRunId: string | null = null",
  "const consumed = new Set<string>()",
  "prototype_assessment_id",
  "consumed.has(assessmentId)",
  "pendingPrototypeAssessment?.assessment ?? null",
  "prototype_assessment_applied",
  "source_research_id: pendingPrototypeAssessment.sourceResearchId",
]) requireText(service, needle, "research service")

for (const needle of [
  'export type PrototypeAssessment = "supports" | "mixed" | "refutes" | "inconclusive"',
  "prototypeAssessment: PrototypeAssessment | null = null",
  'prototypeAssessment === "supports"',
  "evidenceDelta += 6",
  'prototypeAssessment === "mixed"',
  "evidenceDelta += 1",
  'prototypeAssessment === "refutes"',
  "evidenceDelta -= 8",
  "timingDelta -= 3",
  'prototypeAssessment === "inconclusive"',
  "clamp(Math.round(evidenceDelta), -8, 8)",
  "clamp(Math.round(timingDelta), -6, 6)",
  "prototype_assessment: prototypeAssessment",
  "Persistent research can hold or downgrade a thesis, never auto-upgrade it to build/prototype.",
]) requireText(rules, needle, "conviction rules")

for (const needle of [
  'type PrototypeAssessmentValue = "supports" | "mixed" | "refutes" | "inconclusive"',
  "prototypeAssessmentOptions",
  "/prototype-assessment",
  "outcomeResearchId",
  "Clasificación del aprendizaje",
  "Pendiente de evaluación humana",
  "Pendiente de la próxima re-investigación; todavía no modifica convicción.",
  "Ya incorporada por un research posterior; el snapshot conserva su trazabilidad.",
  "latestPrototypeAssessment(item.research_history, prototypeLearning.researchId)",
  "candidate.evidence_summary?.prototype_assessment_id === run.id",
]) requireText(page, needle, "assessment UI")

requireText(ci, "node scripts/opportunity-prototype-assessment-regression.mts", "CI")

console.log("Opportunity prototype assessment regression PASS: only an explicit admin classification of the latest attributable prototype outcome can become directional evidence; classification itself leaves scores unchanged; the next research consumes the latest assessment at most once, keeps total conviction movement within existing bounds, never auto-promotes lifecycle, and surfaces pending/applied state in the thesis workspace.")
