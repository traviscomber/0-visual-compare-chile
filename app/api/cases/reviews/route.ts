import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const caseId = new URL(request.url).searchParams.get("caseId")
  if (!caseId) return NextResponse.json({ error: "Falta caseId." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const [{ data: reviews, error }, { data: members }, { data: role }, { data: governance }, { data: governanceStatus }] = await Promise.all([
    auth.supabase.from("case_review_requests").select("id,case_id,requested_by,reviewer_id,status,message,response_note,created_at,responded_at,updated_at,governance_round_id,deadline_at").eq("case_id", caseId).order("created_at", { ascending: false }),
    auth.supabase.rpc("get_case_members", { p_case_id: caseId }),
    auth.supabase.rpc("case_access_role", { p_case_id: caseId, p_user_id: auth.user.id }),
    auth.supabase.from("case_governance").select("case_id,required_approvals,review_deadline_days,block_on_changes,current_round_id,round_started_at,round_deadline_at,updated_at").eq("case_id", caseId).maybeSingle(),
    auth.supabase.rpc("get_case_governance_status", { p_case_id: caseId }),
  ])
  if (error || !role) return NextResponse.json({ error: "No pudimos cargar las revisiones." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ currentUserId: auth.user.id, currentUserRole: role, reviews: reviews ?? [], members: members ?? [], governance: governance ?? null, governanceStatus: governanceStatus?.[0] ?? null }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { caseId?: string; reviewerId?: string; reviewerIds?: string[]; message?: string; mode?: "single"|"round"; requiredApprovals?: number; deadlineDays?: number; blockOnChanges?: boolean }
  if (!body.caseId) return NextResponse.json({ error: "Solicitud incompleta." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  if (body.mode === "round") {
    const reviewerIds = Array.from(new Set((body.reviewerIds ?? []).filter((id) => typeof id === "string")))
    if (reviewerIds.length === 0) return NextResponse.json({ error: "Selecciona al menos un revisor." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    if (typeof body.requiredApprovals === "number" || typeof body.deadlineDays === "number") {
      const { error: policyError } = await auth.supabase.rpc("set_case_governance", {
        p_case_id: body.caseId,
        p_required_approvals: Math.max(1, Math.min(10, body.requiredApprovals ?? 1)),
        p_review_deadline_days: Math.max(1, Math.min(30, body.deadlineDays ?? 3)),
        p_block_on_changes: body.blockOnChanges !== false,
      })
      if (policyError) return NextResponse.json({ error: "Sólo el responsable puede cambiar la política de aprobación." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    }
    const { data, error } = await auth.supabase.rpc("start_case_approval_round", { p_case_id: body.caseId, p_reviewer_ids: reviewerIds, p_message: body.message ?? null })
    if (error) {
      const msg = error.message.includes("insufficient_reviewers") ? "El número de revisores no alcanza el quórum configurado." : error.message.includes("round_in_progress") ? "Ya existe una ronda de aprobación en curso." : error.message.includes("self_review") ? "No puedes incluirte como revisor." : "No pudimos iniciar la ronda de aprobación."
      return NextResponse.json({ error: msg }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    }
    return NextResponse.json({ roundId: data }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
  }

  if (!body.reviewerId) return NextResponse.json({ error: "Falta reviewerId." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { data, error } = await auth.supabase.rpc("request_case_review", { p_case_id: body.caseId, p_reviewer_id: body.reviewerId, p_message: body.message ?? null })
  if (error) {
    const msg = error.message.includes("self_review") ? "No puedes revisar tu propia solicitud." : error.message.includes("reviewer_not_member") ? "El revisor debe participar en el caso." : error.message.includes("duplicate") ? "Ya existe una revisión pendiente para esa persona." : "No pudimos solicitar la revisión."
    return NextResponse.json({ error: msg }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  return NextResponse.json({ review: data }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { id?: string; action?: "approved"|"changes_requested"|"cancelled"; note?: string }
  if (!body.id || !body.action) return NextResponse.json({ error: "Solicitud incompleta." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const fn = body.action === "cancelled" ? "cancel_case_review" : "respond_case_review"
  const args = body.action === "cancelled" ? { p_review_id: body.id } : { p_review_id: body.id, p_decision: body.action, p_note: body.note ?? null }
  const { data, error } = await auth.supabase.rpc(fn, args)
  if (error) return NextResponse.json({ error: "No pudimos actualizar la revisión." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ review: data }, { headers: PRIVATE_NO_STORE_HEADERS })
}
