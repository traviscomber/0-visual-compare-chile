import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const clamp = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(1, Math.min(168, Math.round(parsed))) : fallback
}

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const caseId = new URL(request.url).searchParams.get("caseId")
  if (!caseId) return NextResponse.json({ error: "Falta caseId." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const [{ data: role }, { data: policy, error }, { data: actions }] = await Promise.all([
    auth.supabase.rpc("case_access_role", { p_case_id: caseId, p_user_id: auth.user.id }),
    auth.supabase.from("case_automation_policy").select("case_id,enabled,auto_remind,auto_raise_priority,remind_before_hours,escalate_before_hours,cooldown_hours,updated_at").eq("case_id", caseId).maybeSingle(),
    auth.supabase.from("case_automation_actions").select("id,action_type,target_user_id,reason,source,created_at").eq("case_id", caseId).order("created_at", { ascending: false }).limit(20),
  ])
  if (!role || error) return NextResponse.json({ error: "No pudimos cargar la automatización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  return NextResponse.json({
    currentUserRole: role,
    policy: policy ?? { case_id: caseId, enabled: false, auto_remind: true, auto_raise_priority: false, remind_before_hours: 24, escalate_before_hours: 12, cooldown_hours: 12, updated_at: null },
    actions: actions ?? [],
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const caseId = typeof body.caseId === "string" ? body.caseId : ""
  if (!caseId) return NextResponse.json({ error: "Falta caseId." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const { data: role } = await auth.supabase.rpc("case_access_role", { p_case_id: caseId, p_user_id: auth.user.id })
  if (role !== "owner") return NextResponse.json({ error: "Sólo el responsable puede configurar automatización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const row = {
    case_id: caseId,
    enabled: body.enabled === true,
    auto_remind: body.autoRemind !== false,
    auto_raise_priority: body.autoRaisePriority === true,
    remind_before_hours: clamp(body.remindBeforeHours, 24),
    escalate_before_hours: clamp(body.escalateBeforeHours, 12),
    cooldown_hours: clamp(body.cooldownHours, 12),
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await auth.supabase.from("case_automation_policy").upsert(row, { onConflict: "case_id" }).select("case_id,enabled,auto_remind,auto_raise_priority,remind_before_hours,escalate_before_hours,cooldown_hours,updated_at").single()
  if (error) return NextResponse.json({ error: "No pudimos guardar la política de automatización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ policy: data }, { headers: PRIVATE_NO_STORE_HEADERS })
}
