import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const caseId = new URL(request.url).searchParams.get("caseId")
  if (!caseId) return NextResponse.json({ error: "Falta caseId." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const [{ data: reviews, error }, { data: members }, { data: role }] = await Promise.all([
    auth.supabase.from("case_review_requests").select("id,case_id,requested_by,reviewer_id,status,message,response_note,created_at,responded_at,updated_at").eq("case_id", caseId).order("created_at", { ascending: false }),
    auth.supabase.rpc("get_case_members", { p_case_id: caseId }),
    auth.supabase.rpc("case_access_role", { p_case_id: caseId, p_user_id: auth.user.id }),
  ])
  if (error || !role) return NextResponse.json({ error: "No pudimos cargar las revisiones." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ currentUserId: auth.user.id, currentUserRole: role, reviews: reviews ?? [], members: members ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { caseId?: string; reviewerId?: string; message?: string }
  if (!body.caseId || !body.reviewerId) return NextResponse.json({ error: "Solicitud incompleta." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
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
