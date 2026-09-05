import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { isMaterialResearchRun } from "@/lib/intelligence/opportunity-attention"

const MAX_BODY_LENGTH = 420

type ResearchRun = {
  id: string
  opportunity_id: string
  run_type: string
  evidence_summary: unknown
  observed_at: string
}

type Comparison = {
  evidence_delta?: number
  timing_delta?: number
  confidence_delta?: number
  direction?: "strengthening" | "weakening" | "stable" | "baseline"
  reasons?: string[]
}

export async function createOpportunityConvictionNotifications(
  client: SupabaseClient,
  input: {
    organizationId: string
    opportunityId: string
    opportunityTitle: string
    creatorUserId: string
    researchRun: ResearchRun
  },
) {
  if (!isMaterialResearchRun(input.researchRun)) return { created: 0, eligible: false }

  const evidence = asRecord(input.researchRun.evidence_summary)
  const comparison = asComparison(evidence.comparison)
  const decisionDegraded = evidence.decision_degraded === true
  if (!comparison || (!decisionDegraded && comparison.direction !== "weakening")) {
    return { created: 0, eligible: false }
  }

  const { data: members, error: membersError } = await client
    .from("organization_members")
    .select("user_id,role")
    .eq("organization_id", input.organizationId)
  if (membersError) throw new Error(`Could not resolve opportunity notification recipients: ${membersError.message}`)

  const recipientIds = [...new Set((members ?? [])
    .filter(member => String(member.role ?? "") === "admin" || String(member.user_id) === input.creatorUserId)
    .map(member => String(member.user_id))
    .filter(Boolean))]
  if (!recipientIds.length) return { created: 0, eligible: true }

  const href = `/oportunidades/tesis?opportunity=${encodeURIComponent(input.opportunityId)}&research=${encodeURIComponent(input.researchRun.id)}`
  const { data: existing, error: existingError } = await client
    .from("user_notifications")
    .select("user_id")
    .in("user_id", recipientIds)
    .eq("kind", "opportunity_conviction")
    .eq("href", href)
  if (existingError) throw new Error(`Could not deduplicate opportunity notifications: ${existingError.message}`)

  const alreadyNotified = new Set((existing ?? []).map(row => String(row.user_id)))
  const pendingRecipients = recipientIds.filter(userId => !alreadyNotified.has(userId))
  if (!pendingRecipients.length) return { created: 0, eligible: true }

  const title = decisionDegraded
    ? `Recomendación degradada · ${input.opportunityTitle}`
    : `Convicción bajó · ${input.opportunityTitle}`
  const body = truncate(buildBody(comparison, decisionDegraded), MAX_BODY_LENGTH)
  const createdAt = new Date().toISOString()
  const rows = pendingRecipients.map(userId => ({
    user_id: userId,
    actor_id: null,
    case_id: null,
    kind: "opportunity_conviction",
    title,
    body,
    href,
    read_at: null,
    created_at: createdAt,
  }))

  const { data, error } = await client
    .from("user_notifications")
    .insert(rows)
    .select("id")
  if (error) throw new Error(`Could not create opportunity conviction notifications: ${error.message}`)

  return { created: data?.length ?? 0, eligible: true }
}

function buildBody(comparison: Comparison, decisionDegraded: boolean) {
  const deltas: string[] = []
  const evidence = numberOrZero(comparison.evidence_delta)
  const timing = numberOrZero(comparison.timing_delta)
  const confidence = numberOrZero(comparison.confidence_delta)
  if (evidence) deltas.push(`evidencia ${signed(evidence)}`)
  if (timing) deltas.push(`timing ${signed(timing)}`)
  if (confidence) deltas.push(`confianza ${signed(Math.round(confidence * 1000) / 10)} pp`)

  const reasons = Array.isArray(comparison.reasons)
    ? comparison.reasons.filter(reason => typeof reason === "string" && reason.trim()).slice(0, 2)
    : []
  const lead = decisionDegraded
    ? "El research degradó la recomendación automática. Revisa la tesis antes de continuar con la decisión vigente."
    : "La evidencia dura debilitó materialmente esta tesis. Revisa si la decisión humana sigue siendo válida."
  const movement = deltas.length ? ` Movimiento: ${deltas.join(" · ")}.` : ""
  return [lead + movement, ...reasons].join(" ")
}

function asComparison(value: unknown): Comparison | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const comparison = value as Comparison
  return comparison.direction ? comparison : null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function numberOrZero(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function truncate(value: string, max: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}
