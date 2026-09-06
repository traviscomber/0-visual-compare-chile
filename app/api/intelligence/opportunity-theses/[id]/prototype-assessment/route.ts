import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AssessmentSchema = z.object({
  organizationId: z.string().uuid(),
  outcomeResearchId: z.string().uuid(),
  assessment: z.enum(["supports", "mixed", "refutes", "inconclusive"]),
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const parsed = AssessmentSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Evaluación, tesis u organización inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  if (access.role !== "admin") {
    return NextResponse.json({ error: "Clasificar el aprendizaje de un prototipo requiere rol administrador." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data: thesis, error: thesisError } = await admin
    .from("innovation_opportunity_theses")
    .select("id,status,confidence,overall_score,evidence_strength,timing_score,strategic_fit,capability_reuse_score,novelty_score,defensibility_score")
    .eq("id", id)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle()

  if (thesisError) {
    console.error("[opportunity-theses:prototype-assessment:thesis]", thesisError)
    return NextResponse.json({ error: "No pudimos cargar la tesis." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!thesis) return NextResponse.json({ error: "Tesis no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  if (thesis.status !== "prototype") {
    return NextResponse.json({ error: "Sólo una tesis en prototipo puede clasificar aprendizaje de ejecución." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data: outcomeRun, error: outcomeError } = await admin
    .from("innovation_opportunity_research_runs")
    .select("id,run_type,evidence_summary,observed_at")
    .eq("id", parsed.data.outcomeResearchId)
    .eq("opportunity_id", id)
    .eq("organization_id", parsed.data.organizationId)
    .eq("run_type", "human_review")
    .maybeSingle()

  if (outcomeError) {
    console.error("[opportunity-theses:prototype-assessment:outcome]", outcomeError)
    return NextResponse.json({ error: "No pudimos cargar el resultado de prototipo." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!outcomeRun) return NextResponse.json({ error: "Resultado de prototipo no encontrado." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })

  const outcome = asRecord(asRecord(outcomeRun.evidence_summary).prototype_outcome)
  if (!String(outcome.action_id ?? "") || !String(outcome.outcome_at ?? "") || !String(outcome.outcome ?? "").trim()) {
    return NextResponse.json({ error: "El registro seleccionado no contiene un resultado de prototipo atribuible." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data: priorRows, error: priorError } = await admin
    .from("innovation_opportunity_research_runs")
    .select("id,evidence_summary,observed_at")
    .eq("opportunity_id", id)
    .eq("organization_id", parsed.data.organizationId)
    .eq("run_type", "human_review")
    .order("observed_at", { ascending: false })
    .limit(50)

  if (priorError) {
    console.error("[opportunity-theses:prototype-assessment:dedupe]", priorError)
    return NextResponse.json({ error: "No pudimos verificar evaluaciones anteriores." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  for (const row of priorRows ?? []) {
    const existing = asRecord(asRecord(row.evidence_summary).prototype_assessment)
    if (existing.source_research_id === outcomeRun.id && existing.assessment === parsed.data.assessment) {
      return NextResponse.json({ assessment: row, created: false }, { headers: PRIVATE_NO_STORE_HEADERS })
    }
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
  const observedAt = new Date().toISOString()

  const { data: assessmentRun, error: insertError } = await admin
    .from("innovation_opportunity_research_runs")
    .insert({
      opportunity_id: id,
      organization_id: parsed.data.organizationId,
      run_type: "human_review",
      research_queries: [],
      evidence_summary: {
        prototype_assessment: {
          source_research_id: outcomeRun.id,
          action_id: String(outcome.action_id),
          outcome_at: String(outcome.outcome_at),
          assessment: parsed.data.assessment,
          actor_role: access.role,
        },
        scores_unchanged: true,
        conviction_effect: "pending_research",
        trigger: "explicit_user_action",
      },
      score_snapshot: scoreSnapshot,
      confidence: Number(thesis.confidence),
      observed_at: observedAt,
      created_by: auth.user.id,
    })
    .select("id,run_type,evidence_summary,score_snapshot,confidence,observed_at")
    .single()

  if (insertError || !assessmentRun) {
    console.error("[opportunity-theses:prototype-assessment:create]", insertError)
    return NextResponse.json({ error: "No pudimos registrar la evaluación del prototipo." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ assessment: assessmentRun, created: true }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
