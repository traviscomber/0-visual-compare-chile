import {
  compareOpportunityMarketStates,
  degradeOpportunityDecision,
  isOpportunityMarketState,
  observeOpportunityMarketState,
  type ConvictionScores,
  type OpportunityMarketState,
  type PrototypeAssessment,
} from "@/lib/intelligence/opportunity-conviction"
import { createOpportunityConvictionNotifications } from "@/lib/intelligence/opportunity-notifications"
import { createAdminClient } from "@/lib/supabase/admin"

export type OpportunityResearchRunType = "live_research" | "scheduled_research"

type AdminClient = ReturnType<typeof createAdminClient>
type PendingPrototypeAssessment = {
  id: string
  assessment: PrototypeAssessment
  sourceResearchId: string
  actionId: string | null
  outcomeAt: string | null
}

export class OpportunityResearchError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) {
    super(message)
    this.name = "OpportunityResearchError"
  }
}

export async function researchPersistedOpportunity(input: {
  admin: AdminClient
  organizationId: string
  opportunityId: string
  actorUserId: string | null
  runType: OpportunityResearchRunType
}) {
  const { admin, organizationId, opportunityId, actorUserId, runType } = input
  const { data: thesisRow, error: thesisError } = await admin
    .from("innovation_opportunity_theses")
    .select("id,organization_id,created_by,title,status,decision,evidence_state,confidence,overall_score,evidence_strength,timing_score,strategic_fit,capability_reuse_score,novelty_score,defensibility_score,research_queries,thesis,last_researched_at")
    .eq("id", opportunityId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (thesisError) {
    console.error("[opportunity-theses:research:load]", thesisError)
    throw new OpportunityResearchError("No pudimos cargar la tesis.", 500, "load_failed")
  }
  if (!thesisRow) throw new OpportunityResearchError("Tesis no encontrada.", 404, "not_found")
  if (["rejected", "archived"].includes(String(thesisRow.status))) {
    throw new OpportunityResearchError("La tesis está cerrada. Reactívala antes de investigar nuevamente.", 409, "closed")
  }

  const query = Array.isArray(thesisRow.research_queries) ? String(thesisRow.research_queries[0] ?? "").trim() : ""
  if (!query) throw new OpportunityResearchError("La tesis no tiene un research probe válido.", 422, "missing_probe")

  const { data: historyRows, error: historyError } = await admin
    .from("innovation_opportunity_research_runs")
    .select("id,evidence_summary,score_snapshot,confidence,observed_at,run_type")
    .eq("opportunity_id", opportunityId)
    .eq("organization_id", organizationId)
    .order("observed_at", { ascending: false })
    .limit(30)

  if (historyError) {
    console.error("[opportunity-theses:research:history]", historyError)
    throw new OpportunityResearchError("No pudimos reconstruir el historial de convicción.", 500, "history_failed")
  }

  const history = (historyRows ?? []) as Array<Record<string, unknown>>
  const previousState = findLatestMarketState(history)
  const pendingPrototypeAssessment = findPendingPrototypeAssessment(history)
  let observation: Awaited<ReturnType<typeof observeOpportunityMarketState>>
  try {
    observation = await observeOpportunityMarketState(query)
  } catch (error) {
    console.error("[opportunity-theses:research:observe]", error)
    throw new OpportunityResearchError("Las fuentes de investigación no respondieron de forma suficiente. La convicción no fue modificada.", 502, "sources_failed")
  }

  if (!observation.state.sources.openalex && !observation.state.sources.inapi_patents) {
    throw new OpportunityResearchError("OpenAlex e INAPI no estuvieron disponibles. VIDENTIA conserva la tesis sin penalizar ni establecer un baseline incompleto.", 503, "hard_sources_unavailable")
  }

  const beforeScores: ConvictionScores = {
    strategic_fit: Number(thesisRow.strategic_fit),
    capability_reuse: Number(thesisRow.capability_reuse_score),
    novelty: Number(thesisRow.novelty_score),
    timing: Number(thesisRow.timing_score),
    evidence_strength: Number(thesisRow.evidence_strength),
    defensibility: Number(thesisRow.defensibility_score),
    overall: Number(thesisRow.overall_score),
  }
  const beforeConfidence = Number(thesisRow.confidence)
  const { comparison, scores, confidence } = compareOpportunityMarketStates(
    previousState,
    observation.state,
    beforeScores,
    beforeConfidence,
    pendingPrototypeAssessment?.assessment ?? null,
  )
  const currentDecision = thesisRow.decision as "build" | "investigate" | "watch" | "reject"
  const evidenceState = thesisRow.evidence_state as "observed" | "mixed" | "hypothesis"
  const nextEvidenceState = evidenceState === "hypothesis" && observation.state.available_axes > 0 ? "mixed" as const : evidenceState
  const decision = degradeOpportunityDecision(currentDecision, nextEvidenceState, scores.evidence_strength, confidence)
  const thesisJson = asRecord(thesisRow.thesis)
  const thesisScores = asRecord(thesisJson.scores)
  const nextThesis = {
    ...thesisJson,
    decision,
    evidence_state: nextEvidenceState,
    confidence,
    scores: {
      ...thesisScores,
      strategic_fit: scores.strategic_fit,
      capability_reuse: scores.capability_reuse,
      novelty: scores.novelty,
      timing: scores.timing,
      evidence_strength: scores.evidence_strength,
      defensibility: scores.defensibility,
      overall: scores.overall,
    },
  }

  const observedAt = observation.state.observed_at
  const rollback = {
    decision: currentDecision,
    evidence_state: evidenceState,
    confidence: beforeConfidence,
    overall_score: beforeScores.overall,
    evidence_strength: beforeScores.evidence_strength,
    timing_score: beforeScores.timing,
    thesis: thesisJson,
    last_researched_at: thesisRow.last_researched_at,
  }

  const { error: updateError } = await admin
    .from("innovation_opportunity_theses")
    .update({
      decision,
      evidence_state: nextEvidenceState,
      confidence,
      overall_score: scores.overall,
      evidence_strength: scores.evidence_strength,
      timing_score: scores.timing,
      thesis: nextThesis,
      last_researched_at: observedAt,
    })
    .eq("id", opportunityId)
    .eq("organization_id", organizationId)

  if (updateError) {
    console.error("[opportunity-theses:research:update]", updateError)
    throw new OpportunityResearchError("La investigación terminó, pero no pudimos aplicar el nuevo snapshot. La tesis no fue modificada.", 500, "update_failed")
  }

  const { data: researchRun, error: runError } = await admin
    .from("innovation_opportunity_research_runs")
    .insert({
      opportunity_id: opportunityId,
      organization_id: organizationId,
      run_type: runType,
      research_queries: [query],
      evidence_summary: {
        market_state: observation.state,
        facts: observation.facts,
        comparison,
        previous_market_state_observed_at: previousState?.observed_at ?? null,
        decision_before: currentDecision,
        decision_after: decision,
        decision_degraded: decision !== currentDecision,
        prototype_assessment_id: pendingPrototypeAssessment?.id ?? null,
        prototype_assessment_applied: pendingPrototypeAssessment ? {
          assessment: pendingPrototypeAssessment.assessment,
          source_research_id: pendingPrototypeAssessment.sourceResearchId,
          action_id: pendingPrototypeAssessment.actionId,
          outcome_at: pendingPrototypeAssessment.outcomeAt,
        } : null,
        news_non_scoring: true,
        trigger: runType === "scheduled_research" ? "vercel_cron" : "explicit_user_action",
      },
      score_snapshot: scores,
      confidence,
      observed_at: observedAt,
      created_by: actorUserId,
    })
    .select("id,opportunity_id,run_type,evidence_summary,score_snapshot,confidence,observed_at")
    .single()

  if (runError || !researchRun) {
    console.error("[opportunity-theses:research:snapshot]", runError)
    const { error: rollbackError } = await admin
      .from("innovation_opportunity_theses")
      .update(rollback)
      .eq("id", opportunityId)
      .eq("organization_id", organizationId)
    if (rollbackError) console.error("[opportunity-theses:research:rollback]", rollbackError)
    throw new OpportunityResearchError("No pudimos guardar la trazabilidad del research; el cambio de convicción fue revertido.", 500, "snapshot_failed")
  }

  let notificationsCreated = 0
  try {
    const notificationResult = await createOpportunityConvictionNotifications(admin, {
      organizationId,
      opportunityId,
      opportunityTitle: String(thesisRow.title),
      creatorUserId: String(thesisRow.created_by),
      researchRun: {
        id: String(researchRun.id),
        opportunity_id: String(researchRun.opportunity_id),
        run_type: String(researchRun.run_type),
        evidence_summary: researchRun.evidence_summary,
        observed_at: String(researchRun.observed_at),
      },
    })
    notificationsCreated = notificationResult.created
  } catch (notificationError) {
    console.error("[opportunity-theses:research:notification]", notificationError)
  }

  return {
    opportunity: {
      id: opportunityId,
      decision,
      evidence_state: nextEvidenceState,
      confidence,
      overall_score: scores.overall,
      evidence_strength: scores.evidence_strength,
      timing_score: scores.timing,
      last_researched_at: observedAt,
    },
    research: researchRun,
    comparison,
    notificationsCreated,
  }
}

function findLatestMarketState(rows: Array<Record<string, unknown>>): OpportunityMarketState | null {
  for (const row of rows) {
    const evidence = asRecord(row.evidence_summary)
    if (isOpportunityMarketState(evidence.market_state)) return evidence.market_state
  }
  return null
}

function findPendingPrototypeAssessment(rows: Array<Record<string, unknown>>): PendingPrototypeAssessment | null {
  let latestOutcomeRunId: string | null = null
  for (const row of rows) {
    const evidence = asRecord(row.evidence_summary)
    const outcome = asRecord(evidence.prototype_outcome)
    if (String(outcome.action_id ?? "") && String(outcome.outcome_at ?? "") && String(outcome.outcome ?? "").trim()) {
      latestOutcomeRunId = String(row.id)
      break
    }
  }
  if (!latestOutcomeRunId) return null

  const consumed = new Set<string>()
  for (const row of rows) {
    const evidence = asRecord(row.evidence_summary)
    const assessmentId = String(evidence.prototype_assessment_id ?? "")
    if (assessmentId) consumed.add(assessmentId)
  }

  for (const row of rows) {
    const evidence = asRecord(row.evidence_summary)
    const assessment = asRecord(evidence.prototype_assessment)
    if (String(assessment.source_research_id ?? "") !== latestOutcomeRunId) continue
    const assessmentId = String(row.id)
    if (consumed.has(assessmentId)) return null
    const value = String(assessment.assessment ?? "")
    if (!isPrototypeAssessment(value)) return null
    return {
      id: assessmentId,
      assessment: value,
      sourceResearchId: latestOutcomeRunId,
      actionId: assessment.action_id ? String(assessment.action_id) : null,
      outcomeAt: assessment.outcome_at ? String(assessment.outcome_at) : null,
    }
  }
  return null
}

function isPrototypeAssessment(value: string): value is PrototypeAssessment {
  return value === "supports" || value === "mixed" || value === "refutes" || value === "inconclusive"
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
