import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { runDecisionCopilot, type CopilotContext } from "@/lib/cases/decision-copilot"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const caseId = new URL(request.url).searchParams.get("caseId")
  if (!caseId) return NextResponse.json({ error: "Falta caseId." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { data: role } = await auth.supabase.rpc("case_access_role", { p_case_id: caseId, p_user_id: auth.user.id })
  if (!role) return NextResponse.json({ error: "No tienes acceso a este caso." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  const { data, error } = await auth.supabase.from("case_copilot_runs").select("id,question,answer,model,estimated_cost_usd,suggested_actions,created_at").eq("case_id", caseId).order("created_at", { ascending: false }).limit(20)
  if (error) return NextResponse.json({ error: "No pudimos cargar el historial del Copilot." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ currentUserRole: role, runs: data ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({})) as { caseId?: string; question?: string }
  const caseId = body.caseId ?? ""
  const question = body.question?.trim().slice(0, 1500) ?? ""
  if (!caseId || question.length < 2) return NextResponse.json({ error: "Pregunta incompleta." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const [{ data: caseRow, error: caseError }, { data: role }] = await Promise.all([
    auth.supabase.from("cases").select("id,title,status,priority,context_type,context_query,decision_summary,notes,last_reviewed_at,created_at,updated_at").eq("id", caseId).maybeSingle(),
    auth.supabase.rpc("case_access_role", { p_case_id: caseId, p_user_id: auth.user.id }),
  ])
  if (caseError || !caseRow || !role) return NextResponse.json({ error: "No tienes acceso a este caso." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const [{ data: evidence }, { data: events }, { data: governance }, { data: governanceStatus }, { data: reviews }] = await Promise.all([
    auth.supabase.from("case_items").select("item_type,title,metadata,created_at").eq("case_id", caseId).order("created_at", { ascending: false }).limit(40),
    auth.supabase.from("case_events").select("event_type,title,payload,occurred_at").eq("case_id", caseId).order("occurred_at", { ascending: false }).limit(30),
    auth.supabase.from("case_governance").select("required_approvals,review_deadline_days,current_round_id,round_deadline_at").eq("case_id", caseId).maybeSingle(),
    auth.supabase.rpc("get_case_governance_status", { p_case_id: caseId }),
    auth.supabase.from("case_review_requests").select("status,created_at,responded_at,deadline_at,response_note").eq("case_id", caseId).order("created_at", { ascending: false }).limit(30),
  ])

  const context: CopilotContext = {
    case: caseRow,
    evidence: (evidence ?? []) as Array<Record<string, unknown>>,
    recentEvents: (events ?? []) as Array<Record<string, unknown>>,
    governance: (governance ?? null) as Record<string, unknown> | null,
    governanceStatus: (governanceStatus?.[0] ?? null) as Record<string, unknown> | null,
    reviews: (reviews ?? []) as Array<Record<string, unknown>>,
  }

  try {
    const result = await runDecisionCopilot({ question, context })
    const { data: run, error: insertError } = await auth.supabase.from("case_copilot_runs").insert({
      case_id: caseId,
      created_by: auth.user.id,
      question,
      answer: result.output.answer,
      model: result.model,
      prompt_tokens: result.promptTokens,
      completion_tokens: result.completionTokens,
      estimated_cost_usd: result.estimatedCostUsd,
      suggested_actions: result.output.suggested_actions,
    }).select("id,created_at").single()
    if (insertError) console.error("[case-copilot] audit insert failed", insertError)

    return NextResponse.json({ ...result.output, model: result.model, estimatedCostUsd: result.estimatedCostUsd, runId: run?.id ?? null, createdAt: run?.created_at ?? new Date().toISOString() }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[case-copilot] failed", error)
    return NextResponse.json({ error: "El Copilot no pudo responder en este momento. La evidencia del caso no fue modificada." }, { status: 502, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
