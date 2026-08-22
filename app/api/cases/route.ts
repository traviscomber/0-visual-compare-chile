import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CASE_STATUSES = new Set(["open", "review", "decided", "archived"])
const CASE_PRIORITIES = new Set(["low", "normal", "high"])
const CONTEXT_TYPES = new Set(["general", "brand", "company", "technology"])
const CASE_SELECT = "id,title,status,priority,context_type,context_query,decision_summary,notes,last_reviewed_at,created_at,updated_at"

export async function GET() {
  const auth = await requireUser(); if (!auth.ok) return auth.response
  const { data, error } = await auth.supabase.from("cases").select(`${CASE_SELECT},case_items(count)`).order("updated_at", { ascending: false })
  if (error) return NextResponse.json({ error: "No pudimos cargar los casos." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ cases: (data ?? []).map((item) => ({ ...item, item_count: Array.isArray(item.case_items) ? Number(item.case_items[0]?.count ?? 0) : 0, case_items: undefined })) }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser(); if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { title?: string; contextType?: string; contextQuery?: string | null; priority?: string }
  const title = body.title?.trim() ?? ""; const contextType = CONTEXT_TYPES.has(body.contextType ?? "") ? body.contextType! : "general"; const priority = CASE_PRIORITIES.has(body.priority ?? "") ? body.priority! : "normal"; const contextQuery = body.contextQuery?.trim().slice(0, 240) || null
  if (title.length < 2 || title.length > 160) return NextResponse.json({ error: "El nombre del caso debe tener entre 2 y 160 caracteres." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { data, error } = await auth.supabase.from("cases").insert({ user_id: auth.user.id, title, context_type: contextType, context_query: contextQuery, priority, updated_at: new Date().toISOString() }).select(CASE_SELECT).single()
  if (error) return NextResponse.json({ error: "No pudimos crear el caso." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ case: data }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser(); if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { id?: string; title?: string; status?: string; priority?: string; decisionSummary?: string | null; notes?: string | null; markReviewed?: boolean }
  if (!body.id) return NextResponse.json({ error: "Falta id." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  if (body.status === "decided") {
    const { data: governance } = await auth.supabase.from("case_governance").select("case_id,current_round_id").eq("case_id", body.id).maybeSingle()
    if (governance) {
      const { data: stateRows, error: stateError } = await auth.supabase.rpc("get_case_governance_status", { p_case_id: body.id })
      if (stateError) return NextResponse.json({ error: "No pudimos verificar la gobernanza del caso." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
      const state = stateRows?.[0]?.state
      if (state !== "approved") return NextResponse.json({ error: state === "blocked" ? "La aprobación está bloqueada porque un revisor solicitó cambios." : state === "overdue" ? "La ronda de aprobación venció y todavía no alcanza el quórum." : "Este caso todavía no alcanza el quórum de aprobación requerido." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
    } else {
      const { count, error: reviewError } = await auth.supabase.from("case_review_requests").select("id", { count: "exact", head: true }).eq("case_id", body.id).eq("status", "pending")
      if (reviewError) return NextResponse.json({ error: "No pudimos verificar el workflow de revisión." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
      if ((count ?? 0) > 0) return NextResponse.json({ error: "Este caso todavía tiene revisiones pendientes." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
    }
  }

  const now = new Date().toISOString(); const patch: Record<string, string | null> = { updated_at: now }
  if (typeof body.title === "string") { const title = body.title.trim(); if (title.length < 2 || title.length > 160) return NextResponse.json({ error: "Nombre de caso inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS }); patch.title = title }
  if (typeof body.status === "string") { if (!CASE_STATUSES.has(body.status)) return NextResponse.json({ error: "Estado inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS }); patch.status = body.status }
  if (typeof body.priority === "string") { if (!CASE_PRIORITIES.has(body.priority)) return NextResponse.json({ error: "Prioridad inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS }); patch.priority = body.priority }
  if (body.decisionSummary !== undefined) patch.decision_summary = body.decisionSummary?.trim().slice(0, 2000) || null
  if (body.notes !== undefined) patch.notes = body.notes?.trim().slice(0, 8000) || null
  if (body.markReviewed === true) patch.last_reviewed_at = now
  const { data, error } = await auth.supabase.from("cases").update(patch).eq("id", body.id).select(CASE_SELECT).single()
  if (error) return NextResponse.json({ error: "No pudimos actualizar el caso." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ case: data }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function DELETE(request: Request) {
  const auth = await requireUser(); if (!auth.ok) return auth.response
  const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { error } = await auth.supabase.from("cases").delete().eq("id", id)
  if (error) return NextResponse.json({ error: "No pudimos eliminar el caso." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}
