import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RequestSchema = z.object({ organizationId: z.string().uuid() })

type LinkedItem = { id: string; case_id: string; metadata: unknown }
type PrototypeAction = {
  id: string
  case_id: string
  status: string
  outcome: string | null
  outcome_at: string | null
  outcome_by: string | null
  completed_at: string | null
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Tesis u organización inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const { data: thesis, error: thesisError } = await admin
    .from("innovation_opportunity_theses")
    .select("id,organization_id,status,confidence,overall_score,evidence_strength,timing_score,strategic_fit,capability_reuse_score,novelty_score,defensibility_score")
    .eq("id", id)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle()

  if (thesisError) {
    console.error("[opportunity-theses:prototype-outcome:thesis]", thesisError)
    return NextResponse.json({ error: "No pudimos cargar la tesis." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!thesis) return NextResponse.json({ error: "Tesis no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  if (thesis.status !== "prototype") {
    return NextResponse.json({ error: "Sólo una tesis aprobada como prototipo puede importar resultados de ejecución." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const sourceId = `opportunity:${id}`
  const { data: itemRows, error: itemError } = await auth.supabase
    .from("case_items")
    .select("id,case_id,metadata")
    .eq("item_type", "research")
    .eq("source_id", sourceId)
    .order("created_at", { ascending: false })
    .limit(10)

  if (itemError) {
    console.error("[opportunity-theses:prototype-outcome:item]", itemError)
    return NextResponse.json({ error: "No pudimos localizar la ejecución del prototipo." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const linkedItems = (itemRows ?? []) as LinkedItem[]
  if (!linkedItems.length) {
    return NextResponse.json({ error: "Esta tesis todavía no tiene una ejecución de prototipo vinculada." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const actionCandidates = linkedItems
    .map(item => ({ item, actionId: String(asRecord(item.metadata).linked_action_id ?? "") }))
    .filter(entry => z.string().uuid().safeParse(entry.actionId).success)

  if (!actionCandidates.length) {
    return NextResponse.json({ error: "La ejecución existe, pero no tiene una acción canónica vinculada." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const actionIds = [...new Set(actionCandidates.map(entry => entry.actionId))]
  const { data: actionRows, error: actionError } = await auth.supabase
    .from("case_actions")
    .select("id,case_id,status,outcome,outcome_at,outcome_by,completed_at")
    .in("id", actionIds)

  if (actionError) {
    console.error("[opportunity-theses:prototype-outcome:action]", actionError)
    return NextResponse.json({ error: "No pudimos leer el resultado del prototipo." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const actions = (actionRows ?? []) as PrototypeAction[]
  const completed = actionCandidates
    .map(entry => ({ entry, action: actions.find(action => action.id === entry.actionId && action.case_id === entry.item.case_id) }))
    .filter(pair => pair.action?.status === "completed" && Boolean(pair.action.outcome?.trim()) && Boolean(pair.action.outcome_at))
    .sort((a, b) => Date.parse(String(b.action?.outcome_at ?? 0)) - Date.parse(String(a.action?.outcome_at ?? 0)))[0]

  if (!completed?.action) {
    return NextResponse.json({ error: "La acción de prototipo aún no tiene un resultado completado y atribuible." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const action = completed.action
  const item = completed.entry.item
  const { data: existingRuns, error: existingError } = await admin
    .from("innovation_opportunity_research_runs")
    .select("id,evidence_summary,observed_at")
    .eq("opportunity_id", id)
    .eq("organization_id", parsed.data.organizationId)
    .eq("run_type", "human_review")
    .order("observed_at", { ascending: false })
    .limit(50)

  if (existingError) {
    console.error("[opportunity-theses:prototype-outcome:history]", existingError)
    return NextResponse.json({ error: "No pudimos verificar la trazabilidad previa del prototipo." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const alreadyCaptured = (existingRuns ?? []).find(run => {
    const evidence = asRecord(run.evidence_summary)
    const prototypeOutcome = asRecord(evidence.prototype_outcome)
    return prototypeOutcome.action_id === action.id && prototypeOutcome.outcome_at === action.outcome_at
  })

  if (alreadyCaptured) {
    return NextResponse.json({
      captured: false,
      research: alreadyCaptured,
      prototype_outcome: buildOutcomePayload(item, action),
    }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  const scoreSnapshot = {
    strategic_fit: Number(thesis.strategic_fit),
    capability_reuse: Number(thesis.capability_reuse_score),
    novelty: Number(thesis.novelty_score),
    timing: Number(thesis.timing_score),
    evidence_strength: Number(thesis.evidence_strength),
    defensibility: Number(thesis.defensibility_score),
    overall: Number(thesis.overall_score),
  }
  const observedAt = String(action.outcome_at)
  const outcomePayload = buildOutcomePayload(item, action)

  const { data: research, error: insertError } = await admin
    .from("innovation_opportunity_research_runs")
    .insert({
      opportunity_id: id,
      organization_id: parsed.data.organizationId,
      run_type: "human_review",
      research_queries: [],
      evidence_summary: {
        prototype_outcome: outcomePayload,
        scores_unchanged: true,
        conviction_effect: "none_until_research",
        trigger: "explicit_user_action",
        actor_role: access.role,
      },
      score_snapshot: scoreSnapshot,
      confidence: Number(thesis.confidence),
      observed_at: observedAt,
      created_by: auth.user.id,
    })
    .select("id,run_type,evidence_summary,score_snapshot,confidence,observed_at,created_at")
    .single()

  if (insertError || !research) {
    console.error("[opportunity-theses:prototype-outcome:insert]", insertError)
    return NextResponse.json({ error: "No pudimos registrar el resultado del prototipo en la tesis." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ captured: true, research, prototype_outcome: outcomePayload }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function buildOutcomePayload(item: LinkedItem, action: PrototypeAction) {
  return {
    source_id: String(asRecord(item.metadata).origin === "opportunity_engine" ? `opportunity:${asRecord(item.metadata).opportunity_id ?? ""}` : ""),
    case_id: item.case_id,
    item_id: item.id,
    action_id: action.id,
    outcome: action.outcome,
    outcome_at: action.outcome_at,
    outcome_by: action.outcome_by,
    completed_at: action.completed_at,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
