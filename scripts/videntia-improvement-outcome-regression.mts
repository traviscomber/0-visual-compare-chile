import { assessVidentiaImprovementOutcome } from "../lib/intelligence/videntia-improvement-outcome.ts"

function fail(message: string): never {
  console.error(`VIDENTIA improvement outcome regression FAIL: ${message}`)
  process.exit(1)
}

function expectVerdict(label: string, expected: string, input: Parameters<typeof assessVidentiaImprovementOutcome>[0]) {
  const assessment = assessVidentiaImprovementOutcome(input)
  if (assessment.verdict !== expected) fail(`${label} expected ${expected}, received ${assessment.verdict}`)
  if (assessment.humanDecisionRequired !== true) fail(`${label} must preserve human decision ownership`)
  if (assessment.decisionEffect !== "none") fail(`${label} must have decisionEffect=none`)
  if (assessment.convictionDelta !== 0) fail(`${label} must have convictionDelta=0`)
  if (assessment.version !== "v1") fail(`${label} must expose deterministic rule version v1`)
  return assessment
}

expectVerdict("decision cycle improves", "improved", {
  candidateKey: "decision-cycle",
  baseline: { pendingDecisions: 6 },
  result: { pendingDecisions: 3 },
})
expectVerdict("decision cycle worsens", "worsened", {
  candidateKey: "decision-cycle",
  baseline: { pendingDecisions: 3 },
  result: { pendingDecisions: 5 },
})
expectVerdict("action hygiene neutral", "neutral", {
  candidateKey: "action-hygiene",
  baseline: { overdueActions: 2 },
  result: { overdueActions: 2 },
})
expectVerdict("github coverage improves", "improved", {
  candidateKey: "github-freshness",
  baseline: { githubReposObserved: 2, acceptedProducts: 4 },
  result: { githubReposObserved: 4, acceptedProducts: 4 },
})
expectVerdict("paper count is not causal proof", "insufficient_evidence", {
  candidateKey: "paper-review-loop",
  baseline: { subsectionPapersObserved: 3 },
  result: { subsectionPapersObserved: 9 },
})
expectVerdict("assistant requires baseline sample", "insufficient_evidence", {
  candidateKey: "assistant-effectiveness",
  baseline: { sampleSize: 4, p95DurationMs: 2000, averageToolCalls: 2, usageCoverage: 1, averageTotalTokens: 1200 },
  result: { sampleSize: 8, p95DurationMs: 1000, averageToolCalls: 1, usageCoverage: 1, averageTotalTokens: 700 },
})
const assistantImproved = expectVerdict("assistant efficiency improves", "improved", {
  candidateKey: "assistant-effectiveness",
  baseline: { sampleSize: 10, p95DurationMs: 2000, averageToolCalls: 2, usageCoverage: 1, averageTotalTokens: 1200 },
  result: { sampleSize: 10, p95DurationMs: 1500, averageToolCalls: 1.5, usageCoverage: 1, averageTotalTokens: 900 },
})
if (assistantImproved.scope !== "assistant_efficiency") fail("assistant assessment must be scoped to technical efficiency, not answer quality")
expectVerdict("assistant mixed evidence stays insufficient", "insufficient_evidence", {
  candidateKey: "assistant-effectiveness",
  baseline: { sampleSize: 10, p95DurationMs: 2000, averageToolCalls: 2, usageCoverage: 1, averageTotalTokens: 1000 },
  result: { sampleSize: 10, p95DurationMs: 1500, averageToolCalls: 3, usageCoverage: 1, averageTotalTokens: 700 },
})
expectVerdict("assistant small movement is neutral", "neutral", {
  candidateKey: "assistant-effectiveness",
  baseline: { sampleSize: 10, p95DurationMs: 2000, averageToolCalls: 2, usageCoverage: 1, averageTotalTokens: 1000 },
  result: { sampleSize: 10, p95DurationMs: 1900, averageToolCalls: 1.9, usageCoverage: 1, averageTotalTokens: 950 },
})
expectVerdict("unknown candidate fails closed", "insufficient_evidence", {
  candidateKey: "future-candidate",
  baseline: { metric: 10 },
  result: { metric: 1 },
})

console.log("VIDENTIA improvement outcome regression PASS: measured improvements are assessed deterministically from persisted baseline/result snapshots; ambiguous or non-causal metrics fail closed as insufficient evidence; Assistant assessment is limited to technical efficiency with minimum samples and materiality thresholds; every result preserves human decision ownership, decisionEffect=none and convictionDelta=0.")
