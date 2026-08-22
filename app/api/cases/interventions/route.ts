import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type InterventionAction = "remind_reviewers" | "extend_deadline" | "raise_priority"

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({})) as { caseId?: string; action?: InterventionAction; days?: number }
  if (!body.caseId || !body.action) return NextResponse.json({ error: "Solicitud incompleta." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  if (body.action === "remind_reviewers") {
    const { data, error } = await auth.supabase.rpc("remind_case_reviewers", { p_case_id: body.caseId })
    if (error) {
      const message = error.message.includes("no_active_round") ? "No existe una ronda activa para recordar." : "No pudimos enviar los recordatorios."
      return NextResponse.json({ error: message }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    }
    return NextResponse.json({ ok: true, notified: Number(data ?? 0) }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  if (body.action === "extend_deadline") {
    const days = Math.max(1, Math.min(14, Number(body.days ?? 2)))
    const { data, error } = await auth.supabase.rpc("extend_case_review_deadline", { p_case_id: body.caseId, p_days: days })
    if (error) {
      const message = error.message.includes("no_active_round") ? "No existe una ronda activa con deadline." : "Sólo el responsable puede extender el deadline."
      return NextResponse.json({ error: message }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    }
    return NextResponse.json({ ok: true, deadlineAt: data }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  if (body.action === "raise_priority") {
    const { data: role } = await auth.supabase.rpc("case_access_role", { p_case_id: body.caseId, p_user_id: auth.user.id })
    if (role !== "owner" && role !== "editor") return NextResponse.json({ error: "No tienes permisos para cambiar la prioridad." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    const { error } = await auth.supabase.from("cases").update({ priority: "high", updated_at: new Date().toISOString() }).eq("id", body.caseId)
    if (error) return NextResponse.json({ error: "No pudimos elevar la prioridad." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ error: "Intervención no soportada." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
}
