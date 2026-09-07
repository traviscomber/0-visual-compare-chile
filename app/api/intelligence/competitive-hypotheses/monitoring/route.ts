import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REVIEW_DECISIONS = new Set(["reviewed", "dismissed"])
const REVIEW_SOURCE_PREFIX = "hypothesis-monitoring:"
const REVIEW_ACTION_PREFIX = "Revisar cambio de hipótesis:"

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const hypothesisId = new URL(request.url).searchParams.get("hypothesisId")?.trim() ?? ""
  if (!UUID_PATTERN.test(hypothesisId)) return badRequest("Hipótesis inválida.")
  const admin = createAdminClient()
  const { data: hypothesis, error: hypothesisError } = await admin.from("competitive_hypotheses")
    .select("id,status")
    .eq("id", hypothesisId)
    .eq("user_id", auth.user.id)
    .maybeSingle()
  if (hypothesisError) return serverError("No pudimos verificar la hipótesis.")
  if (!hypothesis) return NextResponse.json({ error: "Hipótesis no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })

  const { data, error } = await admin.from("competitive_hypothesis_monitoring_events")
    .select("id,hypothesis_id,assessment,summary,evidence_new,evidence_contradictory,source_coverage,review_status,review_reason,reviewed_by,reviewed_at,next_review_at,observed_at")
    .eq("user_id", auth.user.id)
    .eq("hypothesis_id", hypothesisId)
    .order("observed_at", { ascending: false })
    .limit(12)
  if (error) return serverError("No pudimos cargar el monitoreo de la hipótesis.")

  return NextResponse.json({ hypothesisStatus: hypothesis.status, events: (data ?? []).map(normalizeEvent) }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { id?: unknown; decision?: unknown; reason?: unknown; nextReviewAt?: unknown }
  const id = typeof body.id === "string" ? body.id.trim() : ""
  const decision = typeof body.decision === "string" ? body.decision.trim() : ""
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""
  const nextReviewAt = normalizeNextReviewAt(body.nextReviewAt)
  if (!UUID_PATTERN.test(id) || !REVIEW_DECISIONS.has(decision) || reason.length < 4 || reason.length > 1200 || !nextReviewAt) {
    return badRequest("La revisión requiere una decisión, justificación y próxima fecha válidas.")
  }

  const admin = createAdminClient()
  const reviewedAt = new Date().toISOString()
  const { data, error } = await admin.from("competitive_hypothesis_monitoring_events")
    .update({ review_status: decision, review_reason: reason, reviewed_by: auth.user.id, reviewed_at: reviewedAt, next_review_at: nextReviewAt })
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .eq("review_status", "pending")
    .select("id,hypothesis_id,assessment,summary,evidence_new,evidence_contradictory,source_coverage,review_status,review_reason,reviewed_by,reviewed_at,next_review_at,observed_at")
    .maybeSingle()
  if (error) return serverError("No pudimos guardar la revisión de la señal.")
  if (!data) return NextResponse.json({ error: "La señal ya fue revisada o no existe." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })

  const actionResolution = await resolveLinkedExecutiveAction(auth.supabase, auth.user.id, id, decision, reason, nextReviewAt)
  if (!actionResolution.ok) {
    const { error: rollbackError } = await admin.from("competitive_hypothesis_monitoring_events")
      .update({ review_status: "pending", review_reason: null, reviewed_by: null, reviewed_at: null, next_review_at: null })
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .eq("reviewed_by", auth.user.id)
      .eq("reviewed_at", reviewedAt)
    if (rollbackError) console.error("[competitive-hypothesis-review:rollback]", { id, error: rollbackError.message })
    return serverError("No pudimos reconciliar la revisión con su acción ejecutiva. La señal permanece pendiente.")
  }

  return NextResponse.json({ event: normalizeEvent(data), actionResolution }, { headers: PRIVATE_NO_STORE_HEADERS })
}

async function resolveLinkedExecutiveAction(
  supabase: Awaited<ReturnType<typeof requireUser>> extends { ok: true; supabase: infer T } ? T : never,
  userId: string,
  eventId: string,
  decision: string,
  reason: string,
  nextReviewAt: string,
) {
  const sourceId = `${REVIEW_SOURCE_PREFIX}${eventId}`
  const { data: itemRows, error: itemError } = await supabase
    .from("case_items")
    .select("case_id")
    .eq("source_id", sourceId)
    .limit(5)
  if (itemError) return { ok: false as const, linked: false as const }
  const caseIds = [...new Set((itemRows ?? []).map(row => row.case_id).filter(Boolean))]
  if (!caseIds.length) return { ok: true as const, linked: false as const }

  const { data: actionRows, error: actionError } = await supabase
    .from("case_actions")
    .select("id,case_id,status,outcome")
    .in("case_id", caseIds)
    .ilike("title", `${REVIEW_ACTION_PREFIX}%`)
    .order("created_at", { ascending: false })
    .limit(1)
  if (actionError) return { ok: false as const, linked: true as const }
  const action = actionRows?.[0]
  if (!action?.id) return { ok: true as const, linked: false as const }
  if (action.status === "done") return { ok: true as const, linked: true as const, actionId: action.id, alreadyResolved: true as const }

  const decisionLabel = decision === "dismissed" ? "Señal descartada" : "Revisión registrada"
  const outcome = `${decisionLabel}. Motivo: ${reason} Próxima revisión: ${formatDateForOutcome(nextReviewAt)}.`.slice(0, 2000)
  const { data: updated, error: updateError } = await supabase
    .from("case_actions")
    .update({ status: "done", outcome, updated_at: new Date().toISOString() })
    .eq("id", action.id)
    .eq("status", "open")
    .select("id,status,outcome,completed_at,outcome_at,outcome_by")
    .maybeSingle()
  if (updateError || !updated) {
    console.error("[competitive-hypothesis-review:action]", { eventId, actionId: action.id, userId, error: updateError?.message ?? "action_not_updated" })
    return { ok: false as const, linked: true as const }
  }
  return { ok: true as const, linked: true as const, actionId: updated.id, alreadyResolved: false as const }
}

function normalizeNextReviewAt(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : ""
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  const now = Date.now()
  const time = date.getTime()
  if (time < now + 24 * 60 * 60 * 1000 || time > now + 366 * 24 * 60 * 60 * 1000) return null
  return date.toISOString()
}

function formatDateForOutcome(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}

function normalizeEvent(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    hypothesisId: String(row.hypothesis_id ?? ""),
    assessment: String(row.assessment ?? "no_material_change"),
    summary: String(row.summary ?? ""),
    evidenceNew: Array.isArray(row.evidence_new) ? row.evidence_new.slice(0, 12) : [],
    evidenceContradictory: Array.isArray(row.evidence_contradictory) ? row.evidence_contradictory.slice(0, 8) : [],
    sourceCoverage: row.source_coverage && typeof row.source_coverage === "object" ? row.source_coverage : {},
    reviewStatus: String(row.review_status ?? "pending"),
    reviewReason: typeof row.review_reason === "string" ? row.review_reason : null,
    reviewedBy: typeof row.reviewed_by === "string" ? row.reviewed_by : null,
    reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    nextReviewAt: typeof row.next_review_at === "string" ? row.next_review_at : null,
    observedAt: typeof row.observed_at === "string" ? row.observed_at : null,
  }
}

function badRequest(error: string) { return NextResponse.json({ error }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS }) }
function serverError(error: string) { return NextResponse.json({ error }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS }) }
