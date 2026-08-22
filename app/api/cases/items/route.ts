import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ITEM_TYPES = new Set(["comparison", "search", "watch", "alert", "research"])

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const caseId = new URL(request.url).searchParams.get("caseId")
  if (!caseId) return NextResponse.json({ error: "Falta caseId." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const [{ data: caseRow, error: caseError }, { data: items, error: itemsError }, { data: events, error: eventsError }] = await Promise.all([
    auth.supabase.from("cases").select("id,title,status,priority,context_type,context_query,decision_summary,notes,last_reviewed_at,created_at,updated_at").eq("id", caseId).single(),
    auth.supabase.from("case_items").select("id,case_id,item_type,source_id,title,metadata,created_at").eq("case_id", caseId).order("created_at", { ascending: false }),
    auth.supabase.from("case_events").select("id,case_id,event_type,title,payload,occurred_at").eq("case_id", caseId).order("occurred_at", { ascending: false }).limit(200),
  ])

  if (caseError || !caseRow) return NextResponse.json({ error: "Caso no encontrado." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  if (itemsError) return NextResponse.json({ error: "No pudimos cargar la evidencia del caso." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  if (eventsError) return NextResponse.json({ error: "No pudimos cargar la línea de tiempo del caso." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ case: caseRow, items: items ?? [], events: events ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as {
    caseId?: string
    itemType?: string
    sourceId?: string | null
    title?: string
    metadata?: Record<string, unknown>
  }

  const caseId = body.caseId ?? ""
  const itemType = body.itemType ?? ""
  const title = body.title?.trim() ?? ""
  const sourceId = body.sourceId?.trim().slice(0, 240) || null
  if (!caseId || !ITEM_TYPES.has(itemType) || title.length < 1 || title.length > 240) {
    return NextResponse.json({ error: "Evidencia inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data, error } = await auth.supabase
    .from("case_items")
    .upsert({ case_id: caseId, item_type: itemType, source_id: sourceId, title, metadata: body.metadata ?? {} }, { onConflict: "case_id,item_type,source_id", ignoreDuplicates: false })
    .select("id,case_id,item_type,source_id,title,metadata,created_at")
    .single()

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true }, { headers: PRIVATE_NO_STORE_HEADERS })
    return NextResponse.json({ error: "No pudimos guardar la evidencia en el caso." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  await auth.supabase.from("cases").update({ updated_at: new Date().toISOString() }).eq("id", caseId)
  return NextResponse.json({ item: data }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { error } = await auth.supabase.from("case_items").delete().eq("id", id)
  if (error) return NextResponse.json({ error: "No pudimos quitar la evidencia del caso." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}
