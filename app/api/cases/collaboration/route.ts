import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ROLES = new Set(["editor", "viewer"])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const caseId = new URL(request.url).searchParams.get("caseId")
  if (!caseId) return NextResponse.json({ error: "Falta caseId." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const [{ data: members, error: membersError }, { data: comments, error: commentsError }, { data: actions, error: actionsError }, { data: role }] = await Promise.all([
    auth.supabase.rpc("get_case_members", { p_case_id: caseId }),
    auth.supabase.from("case_comments").select("id,case_id,author_id,body,mentions,created_at,updated_at").eq("case_id", caseId).order("created_at", { ascending: false }).limit(100),
    auth.supabase.from("case_actions").select("id,case_id,title,assigned_to,created_by,status,due_at,created_at,completed_at,updated_at").eq("case_id", caseId).order("created_at", { ascending: false }).limit(100),
    auth.supabase.rpc("case_access_role", { p_case_id: caseId, p_user_id: auth.user.id }),
  ])
  if (membersError || commentsError || actionsError || !role) return NextResponse.json({ error: "No pudimos cargar la colaboración del caso." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ currentUserId: auth.user.id, currentUserRole: role, members: members ?? [], comments: comments ?? [], actions: actions ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { type?: string; caseId?: string; email?: string; role?: string; text?: string; mentions?: string[]; title?: string; assignedTo?: string | null; dueAt?: string | null }
  if (!body.caseId || !body.type) return NextResponse.json({ error: "Solicitud incompleta." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  if (body.type === "member") {
    const email = body.email?.trim() ?? ""
    if (!email.includes("@")) return NextResponse.json({ error: "Email inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    const { data, error } = await auth.supabase.rpc("add_case_member_by_email", { p_case_id: body.caseId, p_email: email, p_role: ROLES.has(body.role ?? "") ? body.role : "viewer" })
    if (error) {
      const message = error.message.includes("user_not_found") ? "Ese email todavía no tiene una cuenta en Visual Compare." : error.message.includes("already_owner") ? "Ese usuario ya es responsable del caso." : "No pudimos agregar al participante."
      return NextResponse.json({ error: message }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    }
    return NextResponse.json({ member: data?.[0] ?? null }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
  }

  if (body.type === "comment") {
    const text = body.text?.trim() ?? ""
    if (!text || text.length > 4000) return NextResponse.json({ error: "Comentario inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    const rawMentions = Array.isArray(body.mentions) ? body.mentions.filter((id): id is string => typeof id === "string").slice(0, 20) : []
    const mentions = [...new Set(rawMentions)]
    if (mentions.some((id) => !UUID_PATTERN.test(id))) return NextResponse.json({ error: "Mención inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    if (mentions.length) {
      const { data: memberRows, error: memberError } = await auth.supabase.from("case_members").select("user_id").eq("case_id", body.caseId).in("user_id", mentions)
      if (memberError) return NextResponse.json({ error: "No pudimos validar las menciones." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
      const memberIds = new Set((memberRows ?? []).map((row) => row.user_id))
      if (mentions.some((id) => !memberIds.has(id))) return NextResponse.json({ error: "Sólo puedes mencionar participantes de este caso." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    }
    const { data, error } = await auth.supabase.from("case_comments").insert({ case_id: body.caseId, author_id: auth.user.id, body: text, mentions }).select("id,case_id,author_id,body,mentions,created_at,updated_at").single()
    if (error) {
      if (error.message.includes("case_recipient_not_member")) return NextResponse.json({ error: "Sólo puedes mencionar participantes de este caso." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
      return NextResponse.json({ error: "No pudimos publicar el comentario." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
    }
    return NextResponse.json({ comment: data }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
  }

  if (body.type === "action") {
    const title = body.title?.trim() ?? ""
    const assignedTo = body.assignedTo?.trim() || null
    if (!title || title.length > 240) return NextResponse.json({ error: "Acción inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    if (assignedTo && !UUID_PATTERN.test(assignedTo)) return NextResponse.json({ error: "Responsable inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    if (assignedTo) {
      const { data: assignee, error: assigneeError } = await auth.supabase.from("case_members").select("user_id").eq("case_id", body.caseId).eq("user_id", assignedTo).maybeSingle()
      if (assigneeError) return NextResponse.json({ error: "No pudimos validar al responsable." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
      if (!assignee) return NextResponse.json({ error: "La acción sólo puede asignarse a un participante del caso." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    }
    const { data, error } = await auth.supabase.from("case_actions").insert({ case_id: body.caseId, title, assigned_to: assignedTo, created_by: auth.user.id, due_at: body.dueAt || null }).select("id,case_id,title,assigned_to,created_by,status,due_at,created_at,completed_at,updated_at").single()
    if (error) {
      if (error.message.includes("case_recipient_not_member")) return NextResponse.json({ error: "La acción sólo puede asignarse a un participante del caso." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
      return NextResponse.json({ error: "No pudimos crear la acción." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
    }
    return NextResponse.json({ action: data }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ error: "Tipo de operación inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { type?: string; id?: string; caseId?: string; role?: string; status?: string }
  if (!body.id || !body.type) return NextResponse.json({ error: "Solicitud incompleta." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  if (body.type === "member") {
    if (!body.caseId || !ROLES.has(body.role ?? "")) return NextResponse.json({ error: "Rol inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    const { error } = await auth.supabase.from("case_members").update({ role: body.role }).eq("case_id", body.caseId).eq("user_id", body.id).neq("role", "owner")
    if (error) return NextResponse.json({ error: "No pudimos cambiar el rol." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  if (body.type === "action") {
    const status = body.status === "done" ? "done" : "open"
    const now = new Date().toISOString()
    const { error } = await auth.supabase.from("case_actions").update({ status, completed_at: status === "done" ? now : null, updated_at: now }).eq("id", body.id)
    if (error) return NextResponse.json({ error: "No pudimos actualizar la acción." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ error: "Tipo de operación inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const url = new URL(request.url)
  const type = url.searchParams.get("type")
  const id = url.searchParams.get("id")
  const caseId = url.searchParams.get("caseId")
  if (!type || !id) return NextResponse.json({ error: "Solicitud incompleta." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  if (type === "member") {
    if (!caseId) return NextResponse.json({ error: "Falta caseId." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    const { error } = await auth.supabase.from("case_members").delete().eq("case_id", caseId).eq("user_id", id).neq("role", "owner")
    if (error) return NextResponse.json({ error: "No pudimos retirar al participante." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (type === "comment") {
    const { error } = await auth.supabase.from("case_comments").delete().eq("id", id)
    if (error) return NextResponse.json({ error: "No pudimos eliminar el comentario." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (type === "action") {
    const { error } = await auth.supabase.from("case_actions").delete().eq("id", id)
    if (error) return NextResponse.json({ error: "No pudimos eliminar la acción." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
  }
  return NextResponse.json({ error: "Tipo inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
}
