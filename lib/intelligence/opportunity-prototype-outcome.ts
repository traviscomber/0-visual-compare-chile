import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

type CompletedAction = {
  id: string
  case_id: string
  status: string
  outcome: string | null
  outcome_at: string | null
  outcome_by: string | null
  completed_at: string | null
}

type LinkedItem = {
  id: string
  case_id: string
  item_type: string
  source_id: string
  metadata: unknown
}

export async function captureOpportunityPrototypeOutcome(
  client: SupabaseClient,
  userId: string,
  action: CompletedAction,
) {
  if (
    action.status !== "done" ||
    !action.outcome?.trim() ||
    !action.outcome_at ||
    !action.outcome_by ||
    action.outcome_by !== userId
  ) {
    return { matched: false as const, captured: false as const, reason: "not_attributable_completed_outcome" as const }
  }

  const { data: itemRows, error: itemError } = await client
    .from("case_items")
    .select("id,case_id,item_type,source_id,metadata")
    .eq("case_id", action.case_id)
    .eq("item_type", "research")
    .limit(30)

  if (itemError) throw new Error(`Could not inspect prototype evidence: ${itemError.message}`)

  const linked = ((itemRows ?? []) as LinkedItem[]).find(item => {
    const metadata = asRecord(item.metadata)
    const opportunityId = String(metadata.opportunity_id ?? "")
    return metadata.origin === "opportunity_engine" &&
      metadata.human_decision === "prototype" &&
      String(metadata.linked_action_id ?? "") === action.id &&
      Boolean(opportunityId) &&
      item.source_id === `opportunity:${opportunityId}`
  })

  if (!linked) return { matched: false as const, captured: false as const, reason: "not_opportunity_prototype" as const }

  const metadata = asRecord(linked.metadata)
  const organizationId = String(metadata.organization_id ?? "")
  const opportunityId = String(metadata.opportunity_id ?? "")
  if (!isUuid(organizationId) || !isUuid(opportunityId)) {
    throw new Error("Prototype evidence is missing canonical organization/opportunity identity")
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, userId, organizationId)
  if (!access.ok) {
    return { matched: true as const, captured: false as const, reason: "outcome_actor_not_organization_member" as const }
  }

  const { data: thesis, error: thesisError } = await admin
    .from("innovation_opportunity_theses")
    .select("id,status,confidence,overall_score,evidence_strength,timing_score,strategic_fit,capability_reuse_score,novelty_score,defensibility_score")
    .eq("id", opportunityId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (thesisError) throw new Error(`Could not load prototype thesis: ${thesisError.message}`)
  if (!thesis || thesis.status !== "prototype") {
    return { matched: true as const, captured: false as const, reason: "thesis_not_active_prototype" as const }
  }

  const { data: priorRuns, error: priorError } = await admin
    .from("innovation_opportunity_research_runs")
    .select("id,evidence_summary,observed_at")
    .eq("opportunity_id", opportunityId)
    .eq("organization_id", organizationId)
    .eq("run_type", "human_review")
    .order("observed_at", { ascending: false })
    .limit(50)

  if (priorError) throw new Error(`Could not inspect prototype outcome lineage: ${priorError.message}`)

  const duplicate = (priorRuns ?? []).find(row => {
    const prototypeOutcome = asRecord(asRecord(row.evidence_summary).prototype_outcome)
    return prototypeOutcome.action_id === action.id && prototypeOutcome.outcome_at === action.outcome_at
  })
  if (duplicate) {
    return { matched: true as const, captured: false as const, reason: "already_captured" as const, researchId: String(duplicate.id) }
  }

  const scoreSnapshot = {
    strategic_fit: Number(thesis.strategic_fit),
    capability_reuse: Number(thesis.capability_reuse_score),
    novelty: Number(thesis.novelty_score),
    timing: Number(thesis.timing_score),
    evidence_strength: Number(thesis.evidence_strength),
    defensibility: Number(thesis.defensibility_score),
    overall: Number(thesis.overall_score),
  }
  const prototypeOutcome = {
    source_id: linked.source_id,
    case_id: action.case_id,
    item_id: linked.id,
    action_id: action.id,
    outcome: action.outcome.trim(),
    outcome_at: action.outcome_at,
    outcome_by: action.outcome_by,
    completed_at: action.completed_at,
    human_review_id: metadata.human_review_id ?? null,
  }

  const { data: research, error: insertError } = await admin
    .from("innovation_opportunity_research_runs")
    .insert({
      opportunity_id: opportunityId,
      organization_id: organizationId,
      run_type: "human_review",
      research_queries: [],
      evidence_summary: {
        prototype_outcome: prototypeOutcome,
        scores_unchanged: true,
        conviction_effect: "none_until_research",
        trigger: "human_action_completion",
        actor_role: access.role,
      },
      score_snapshot: scoreSnapshot,
      confidence: Number(thesis.confidence),
      observed_at: action.outcome_at,
      created_by: userId,
    })
    .select("id,observed_at")
    .single()

  if (insertError || !research) throw new Error(`Could not append prototype outcome lineage: ${insertError?.message ?? "missing research row"}`)

  return {
    matched: true as const,
    captured: true as const,
    researchId: String(research.id),
    opportunityId,
    organizationId,
    prototypeOutcome,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
