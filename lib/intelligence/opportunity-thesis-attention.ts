export type PrototypeAssessment = "supports" | "mixed" | "refutes" | "inconclusive"

export type OpportunityResearchHistoryRun = {
  id: string
  evidence_summary?: unknown
  observed_at?: string | null
}

export type PrototypeLearningAttention = {
  kind: "needs_assessment" | "needs_research"
  assessment: PrototypeAssessment | null
  outcomeResearchId: string
  assessmentResearchId: string | null
}

export function getPrototypeLearningAttention(history: OpportunityResearchHistoryRun[]): PrototypeLearningAttention | null {
  const rows = [...history].sort((a, b) => timestamp(b.observed_at) - timestamp(a.observed_at))
  const outcomeRun = rows.find(run => {
    const evidence = asRecord(run.evidence_summary)
    const outcome = asRecord(evidence.prototype_outcome)
    return Boolean(String(outcome.action_id ?? "") && String(outcome.outcome_at ?? "") && String(outcome.outcome ?? "").trim())
  })
  if (!outcomeRun) return null

  const assessmentRun = rows.find(run => {
    const evidence = asRecord(run.evidence_summary)
    const assessment = asRecord(evidence.prototype_assessment)
    return String(assessment.source_research_id ?? "") === outcomeRun.id && isPrototypeAssessment(String(assessment.assessment ?? ""))
  })
  if (!assessmentRun) {
    return {
      kind: "needs_assessment",
      assessment: null,
      outcomeResearchId: outcomeRun.id,
      assessmentResearchId: null,
    }
  }

  const consumed = rows.some(run => {
    const evidence = asRecord(run.evidence_summary)
    return String(evidence.prototype_assessment_id ?? "") === assessmentRun.id
  })
  if (consumed) return null

  const assessment = asRecord(asRecord(assessmentRun.evidence_summary).prototype_assessment)
  return {
    kind: "needs_research",
    assessment: String(assessment.assessment) as PrototypeAssessment,
    outcomeResearchId: outcomeRun.id,
    assessmentResearchId: assessmentRun.id,
  }
}

function isPrototypeAssessment(value: string): value is PrototypeAssessment {
  return value === "supports" || value === "mixed" || value === "refutes" || value === "inconclusive"
}

function timestamp(value?: string | null) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
