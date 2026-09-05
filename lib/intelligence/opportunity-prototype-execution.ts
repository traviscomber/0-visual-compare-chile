import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

type IntelligenceActionRow = {
  case_id: string
  item_id: string
  action_id: string
  case_created: boolean
  item_created: boolean
  action_created: boolean
}

export async function ensureOpportunityPrototypeExecution(
  client: SupabaseClient,
  input: {
    organizationId: string
    opportunityId: string
    opportunityTitle: string
    decisionMakerUserId: string
    humanReviewId: string
    rationale: string
    evidenceWarning: string | null
    scoreSnapshot: Record<string, number>
    confidence: number
  },
) {
  const contextQuery = truncate(`Opportunity Engine · ${input.opportunityTitle}`, 240)
  const caseTitle = truncate(`${input.opportunityTitle} · prototipo`, 160)
  const sourceId = `opportunity:${input.opportunityId}`
  const sourceTitle = truncate(`Tesis aprobada para prototipo · ${input.opportunityTitle}`, 240)
  const actionTitle = "Definir experimento de prototipo"

  const { data, error } = await client.rpc("create_intelligence_action", {
    p_context_type: "general",
    p_context_query: contextQuery,
    p_case_title: caseTitle,
    p_item_type: "research",
    p_source_id: sourceId,
    p_source_title: sourceTitle,
    p_action_title: actionTitle,
    p_priority: "normal",
    p_due_at: null,
    p_assigned_to: input.decisionMakerUserId,
    p_evidence: {
      origin: "opportunity_engine",
      organization_id: input.organizationId,
      opportunity_id: input.opportunityId,
      human_review_id: input.humanReviewId,
      human_decision: "prototype",
      rationale: input.rationale,
      evidence_warning: input.evidenceWarning,
      scores: input.scoreSnapshot,
      confidence: input.confidence,
      execution_policy: "explicit_human_prototype_approval",
    },
  })

  if (error) throw new Error(`Could not create prototype execution action: ${error.message}`)
  const row = (Array.isArray(data) ? data[0] : data) as IntelligenceActionRow | null
  if (!row?.case_id || !row.item_id || !row.action_id) {
    throw new Error("Prototype execution action did not return canonical identifiers")
  }

  return {
    linked: true as const,
    caseId: row.case_id,
    itemId: row.item_id,
    actionId: row.action_id,
    href: `/casos/${row.case_id}/equipo`,
    created: {
      case: Boolean(row.case_created),
      evidence: Boolean(row.item_created),
      action: Boolean(row.action_created),
    },
    assignedTo: input.decisionMakerUserId,
    actionTitle,
  }
}

function truncate(value: string, max: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}
