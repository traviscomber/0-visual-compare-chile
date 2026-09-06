import { NextResponse } from "next/server"
import { PRIVATE_NO_STORE_HEADERS, requireUser } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type FeedbackType = "relevant" | "irrelevant" | "false_match" | "identity_incorrect"
type TargetType = "strategic_watch_event" | "watch_signal"
const FEEDBACK_TYPES = new Set<FeedbackType>(["relevant", "irrelevant", "false_match", "identity_incorrect"])
const TARGET_TYPES = new Set<TargetType>(["strategic_watch_event", "watch_signal"])
const DEFAULT_TARGET_TYPE: TargetType = "strategic_watch_event"

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const targetType = (new URL(request.url).searchParams.get("targetType") ?? DEFAULT_TARGET_TYPE) as TargetType
  if (!TARGET_TYPES.has(targetType)) {
    return NextResponse.json({ error: "Tipo de feedback no soportado." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data, error } = await auth.supabase
    .from("intelligence_feedback")
    .select("id,target_type,target_key,feedback_type,note,updated_at")
    .eq("user_id", auth.user.id)
    .eq("target_type", targetType)
    .order("updated_at", { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: "No pudimos cargar el feedback de inteligencia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ feedback: data ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({})) as {
    targetType?: string
    targetKey?: string
    feedbackType?: string
    note?: string
  }
  const targetType = (body.targetType ?? DEFAULT_TARGET_TYPE) as TargetType
  const targetKey = body.targetKey?.trim() ?? ""
  const feedbackType = body.feedbackType as FeedbackType | undefined
  const note = body.note?.trim() || null

  if (!TARGET_TYPES.has(targetType) || !targetKey || targetKey.length > 300 || !feedbackType || !FEEDBACK_TYPES.has(feedbackType)) {
    return NextResponse.json({ error: "Feedback inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("submit_intelligence_feedback", {
    p_user_id: auth.user.id,
    p_target_type: targetType,
    p_target_key: targetKey,
    p_feedback_type: feedbackType,
    p_note: note,
    p_metadata: { surface: targetType === "watch_signal" ? "common_monitoring" : "strategic_monitoring" },
  })

  if (error) {
    const status = error.message.includes("target_not_found") ? 404 : 400
    return NextResponse.json({ error: status === 404 ? "La señal ya no está disponible." : "No pudimos guardar la validación." }, { status, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true, id: data }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const id = new URL(request.url).searchParams.get("id")?.trim()
  if (!id) {
    return NextResponse.json({ error: "Falta id." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("delete_intelligence_feedback", {
    p_user_id: auth.user.id,
    p_id: id,
  })
  if (error) {
    return NextResponse.json({ error: "No pudimos eliminar el feedback." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: Boolean(data) }, { headers: PRIVATE_NO_STORE_HEADERS })
}