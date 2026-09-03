import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeQuery(type: string, value: string) {
  const cleaned = value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
  return type === "ipc" ? cleaned.replace(/\s+/g, "") : cleaned.replace(/\s+/g, " ")
}

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const [{ data: watches, error: watchError }, { data: events, error: eventError }] = await Promise.all([
    auth.supabase.from("patent_watches").select("id,watch_type,query,is_active,last_checked_at,created_at").eq("source_type", "inapi_open_data").order("created_at", { ascending: false }),
    auth.supabase.from("patent_alert_events").select("id,watch_id,title,application_number,applicants,ipc_codes,filing_date,detected_at,read_at").eq("source_key", "inapi_open_data").order("detected_at", { ascending: false }).limit(100),
  ])
  if (watchError || eventError) return NextResponse.json({ error: "No pudimos cargar las alertas." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ watches: watches ?? [], events: events ?? [], unread: (events ?? []).filter((event) => !event.read_at).length }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { type?: string; query?: string }
  const type = body.type === "ipc" ? "ipc" : body.type === "company" ? "company" : ""
  const query = body.query?.trim() ?? ""
  if (!type || query.length < 2 || query.length > 160) return NextResponse.json({ error: "Vigilancia inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const normalized = normalizeQuery(type, query)
  const { data, error } = await auth.supabase.from("patent_watches").upsert({ user_id: auth.user.id, watch_type: type, query, normalized_query: normalized, source_type: "inapi_open_data", is_active: true, last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id,watch_type,normalized_query,source_type" }).select("id,watch_type,query,is_active,last_checked_at,created_at").single()
  if (error) return NextResponse.json({ error: "No pudimos crear la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ watch: data }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { id?: string; active?: boolean; eventId?: string }
  if (body.eventId) {
    const { error } = await auth.supabase.from("patent_alert_events").update({ read_at: new Date().toISOString() }).eq("id", body.eventId).eq("source_key", "inapi_open_data")
    if (error) return NextResponse.json({ error: "No pudimos marcar la alerta." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!body.id || typeof body.active !== "boolean") return NextResponse.json({ error: "Cambio inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { error } = await auth.supabase.from("patent_watches").update({ is_active: body.active, last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", body.id).eq("source_type", "inapi_open_data")
  if (error) return NextResponse.json({ error: "No pudimos actualizar la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { error } = await auth.supabase.from("patent_watches").delete().eq("id", id).eq("source_type", "inapi_open_data")
  if (error) return NextResponse.json({ error: "No pudimos eliminar la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}
