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

type PrototypeLearningStage = "assessment" | "research"
type PrototypeAssessment = "supports" | "mixed" | "refutes" | "inconclusive"

const assessmentLabels: Record<PrototypeAssessment, string> = {
  supports: "apoya la tesis",
  mixed: "resultado mixto",
  refutes: "refuta la tesis",
  inconclusive: "inconcluso",
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

  const recipientIds = await resolveRecipients(client, input.organizationId, input.creatorUserId, "creator_and_admins")
  if (!recipientIds.length) return { created: 0, eligible: true }

  const href = `/oportunidades/tesis?opportunity=${encodeURIComponent(input.opportunityId)}&research=${encodeURIComponent(input.researchRun.id)}`
  const pendingRecipients = await unresolvedRecipients(client, recipientIds, "opportunity_conviction", href)
  if (!pendingRecipients.length) return { created: 0, eligible: true }

  const title = decisionDegraded
    ? `Recomendación degradada · ${input.opportunityTitle}`
    : `Convicción bajó · ${input.opportunityTitle}`
  const body = truncate(buildBody(comparison, decisionDegraded), MAX_BODY_LENGTH)
  const created = await insertNotifications(client, pendingRecipients, {
    kind: "opportunity_conviction",
    title,
    body,
    href,
  })

  return { created, eligible: true }
}

export async function createOpportunityPrototypeLearningNotifications(
  client: SupabaseClient,
  input: {
    organizationId: string
    opportunityId: string
    opportunityTitle: string
    creatorUserId: string
    stage: PrototypeLearningStage
    sourceId: string
    assessment?: PrototypeAssessment | null
  },
) {
  const recipientMode = input.stage === "assessment" ? "admins_only" : "creator_and_admins"
  const recipientIds = await resolveRecipients(client, input.organizationId, input.creatorUserId, recipientMode)
  if (!recipientIds.length) return { created: 0, eligible: true }

  const href = prototypeLearningHref(input)
  const pendingRecipients = await unresolvedRecipients(client, recipientIds, "opportunity_prototype_learning", href)
  if (!pendingRecipients.length) return { created: 0, eligible: true }

  const title = input.stage === "assessment"
    ? `Resultado de prototipo por clasificar · ${input.opportunityTitle}`
    : `Aprendizaje de prototipo listo para re-investigar · ${input.opportunityTitle}`
  const assessmentLabel = input.assessment ? assessmentLabels[input.assessment] : "evaluación registrada"
  const body = input.stage === "assessment"
    ? "Se registró un outcome atribuible de prototipo. Un administrador debe clasificar el aprendizaje antes de que pueda entrar al siguiente research. El resultado no cambia score ni convicción por sí solo."
    : `La evaluación humana del prototipo quedó como ${assessmentLabel}. Re-investiga la tesis para que ese aprendizaje pueda ser consumido una sola vez dentro de los límites de convicción existentes.`
  const created = await insertNotifications(client, pendingRecipients, {
    kind: "opportunity_prototype_learning",
    title,
    body: truncate(body, MAX_BODY_LENGTH),
    href,
  })

  return { created, eligible: true }
}

export async function resolveOpportunityPrototypeLearningNotifications(
  client: SupabaseClient,
  input: {
    opportunityId: string
    stage: PrototypeLearningStage
    sourceId: string
  },
) {
  const href = prototypeLearningHref(input)
  const resolvedAt = new Date().toISOString()
  const { data, error } = await client
    .from("user_notifications")
    .update({ read_at: resolvedAt })
    .eq("kind", "opportunity_prototype_learning")
    .eq("href", href)
    .is("read_at", null)
    .select("id")
  if (error) throw new Error(`Could not resolve prototype learning notifications: ${error.message}`)

  return { resolved: data?.length ?? 0, href, resolvedAt }
}

function prototypeLearningHref(input: { opportunityId: string; stage: PrototypeLearningStage; sourceId: string }) {
  return input.stage === "assessment"
    ? `/oportunidades/tesis?opportunity=${encodeURIComponent(input.opportunityId)}&outcome=${encodeURIComponent(input.sourceId)}`
    : `/oportunidades/tesis?opportunity=${encodeURIComponent(input.opportunityId)}&assessment=${encodeURIComponent(input.sourceId)}`
}

async function resolveRecipients(
  client: SupabaseClient,
  organizationId: string,
  creatorUserId: string,
  mode: "admins_only" | "creator_and_admins",
) {
  const { data: members, error } = await client
    .from("organization_members")
    .select("user_id,role")
    .eq("organization_id", organizationId)
  if (error) throw new Error(`Could not resolve opportunity notification recipients: ${error.message}`)

  return [...new Set((members ?? [])
    .filter(member => String(member.role ?? "") === "admin" || (mode === "creator_and_admins" && String(member.user_id) === creatorUserId))
    .map(member => String(member.user_id))
    .filter(Boolean))]
}

async function unresolvedRecipients(client: SupabaseClient, recipientIds: string[], kind: string, href: string) {
  const { data: existing, error } = await client
    .from("user_notifications")
    .select("user_id")
    .in("user_id", recipientIds)
    .eq("kind", kind)
    .eq("href", href)
  if (error) throw new Error(`Could not deduplicate opportunity notifications: ${error.message}`)

  const alreadyNotified = new Set((existing ?? []).map(row => String(row.user_id)))
  return recipientIds.filter(userId => !alreadyNotified.has(userId))
}

async function insertNotifications(
  client: SupabaseClient,
  recipientIds: string[],
  input: { kind: string; title: string; body: string; href: string },
) {
  const createdAt = new Date().toISOString()
  const rows = recipientIds.map(userId => ({
    user_id: userId,
    actor_id: null,
    case_id: null,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href,
    read_at: null,
    created_at: createdAt,
  }))
  const { data, error } = await client.from("user_notifications").insert(rows).select("id")
  if (error) throw new Error(`Could not create opportunity notifications: ${error.message}`)
  return data?.length ?? 0
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
