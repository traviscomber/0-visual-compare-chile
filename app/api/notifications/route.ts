import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { data, error } = await auth.supabase
    .from("user_notifications")
    .select("id,case_id,kind,title,body,href,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: "No pudimos cargar tus notificaciones." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  const notifications = data ?? []
  return NextResponse.json({ notifications, unreadCount: notifications.filter((item) => !item.read_at).length }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { id?: string; all?: boolean }
  const now = new Date().toISOString()
  let query = auth.supabase.from("user_notifications").update({ read_at: now }).is("read_at", null)
  if (!body.all) {
    if (!body.id) return NextResponse.json({ error: "Falta id." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
    query = query.eq("id", body.id)
  }
  const { error } = await query
  if (error) return NextResponse.json({ error: "No pudimos actualizar la notificación." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}
