import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REVIEW_DECISIONS = new Set(["reviewed", "dismissed"])

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
    .select("id,hypothesis_id,assessment,summary,evidence_new,evidence_contradictory,source_coverage,review_status,review_reason,reviewed_by,reviewed_at,observed_at")
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
  const body = await request.json().catch(() => ({})) as { id?: unknown; decision?: unknown; reason?: unknown }
  const id = typeof body.id === "string" ? body.id.trim() : ""
  const decision = typeof body.decision === "string" ? body.decision.trim() : ""
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""
  if (!UUID_PATTERN.test(id) || !REVIEW_DECISIONS.has(decision) || reason.length < 4 || reason.length > 1200) {
    return badRequest("La revisión requiere una decisión y justificación válidas.")
  }
  const admin = createAdminClient()
  const reviewedAt = new Date().toISOString()
  const { data, error } = await admin.from("competitive_hypothesis_monitoring_events")
    .update({ review_status: decision, review_reason: reason, reviewed_by: auth.user.id, reviewed_at: reviewedAt })
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .eq("review_status", "pending")
    .select("id,hypothesis_id,assessment,summary,evidence_new,evidence_contradictory,source_coverage,review_status,review_reason,reviewed_by,reviewed_at,observed_at")
    .maybeSingle()
  if (error) return serverError("No pudimos guardar la revisión de la señal.")
  if (!data) return NextResponse.json({ error: "La señal ya fue revisada o no existe." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ event: normalizeEvent(data) }, { headers: PRIVATE_NO_STORE_HEADERS })
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
    observedAt: typeof row.observed_at === "string" ? row.observed_at : null,
  }
}

function badRequest(error: string) { return NextResponse.json({ error }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS }) }
function serverError(error: string) { return NextResponse.json({ error }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS }) }
