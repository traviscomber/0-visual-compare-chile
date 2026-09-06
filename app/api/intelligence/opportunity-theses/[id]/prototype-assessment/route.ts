import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import {
  createOpportunityPrototypeLearningNotifications,
  resolveOpportunityPrototypeLearningNotifications,
} from "@/lib/intelligence/opportunity-notifications"
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
    .select("id,title,created_by,status,confidence,overall_score,evidence_strength,timing_score,strategic_fit,capability_reuse_score,novelty_score,defensibility_score")
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

  const organizationId = parsed.data.organizationId
  const assessmentValue = parsed.data.assessment
  const outcomeResearchId = String(outcomeRun.id)
  const thesisTitle = String(thesis.title)
  const thesisCreatorUserId = String(thesis.created_by)

  async function syncPrototypeLearningNotifications(assessmentId: string, supersededAssessmentIds: string[]) {
    let notificationsResolved = 0
    let notificationsCreated = 0

    try {
      const resolution = await resolveOpportunityPrototypeLearningNotifications(admin, {
        opportunityId: id,
        stage: "assessment",
        sourceId: outcomeResearchId,
      })
      notificationsResolved += resolution.resolved
    } catch (notificationError) {
      console.error("[opportunity-theses:prototype-assessment:notification-resolution]", notificationError)
    }

    for (const supersededAssessmentId of supersededAssessmentIds) {
      try {
        const resolution = await resolveOpportunityPrototypeLearningNotifications(admin, {
          opportunityId: id,
          stage: "research",
          sourceId: supersededAssessmentId,
        })
        notificationsResolved += resolution.resolved
      } catch (notificationError) {
        console.error("[opportunity-theses:prototype-assessment:superseded-notification-resolution]", notificationError)
      }
    }

    try {
      const notificationResult = await createOpportunityPrototypeLearningNotifications(admin, {
        organizationId,
        opportunityId: id,
        opportunityTitle: thesisTitle,
        creatorUserId: thesisCreatorUserId,
        stage: "research",
        sourceId: assessmentId,
        assessment: assessmentValue,
      })
      notificationsCreated = notificationResult.created
    } catch (notificationError) {
      console.error("[opportunity-theses:prototype-assessment:notification]", notificationError)
    }

    return { notificationsResolved, notificationsCreated }
  }

  const { data: priorRows, error: priorError } = await admin
    .from("innovation_opportunity_research_runs")
    .select("id,evidence_summary,observed_at")
    .eq("opportunity_id", id)
    .eq("organization_id", organizationId)
    .eq("run_type", "human_review")
    .order("observed_at", { ascending: false })
    .limit(50)

  if (priorError) {
    console.error("[opportunity-theses:prototype-assessment:dedupe]", priorError)
    return NextResponse.json({ error: "No pudimos verificar evaluaciones anteriores." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const priorAssessments = (priorRows ?? []).filter(row => {
    const existing = asRecord(asRecord(row.evidence_summary).prototype_assessment)
    return String(existing.source_research_id ?? "") === outcomeResearchId
  })
  const priorAssessmentIds = priorAssessments.map(row => String(row.id))
  const latestPriorAssessment = priorAssessments[0] ?? null
  if (latestPriorAssessment) {
    const latestExisting = asRecord(asRecord(latestPriorAssessment.evidence_summary).prototype_assessment)
    if (latestExisting.assessment === assessmentValue) {
      const assessmentId = String(latestPriorAssessment.id)
      const notificationSync = await syncPrototypeLearningNotifications(
        assessmentId,
        priorAssessmentIds.filter(priorAssessmentId => priorAssessmentId !== assessmentId),
      )
      return NextResponse.json({ assessment: latestPriorAssessment, created: false, ...notificationSync }, { headers: PRIVATE_NO_STORE_HEADERS })
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
      organization_id: organizationId,
      run_type: "human_review",
      research_queries: [],
      evidence_summary: {
        prototype_assessment: {
          source_research_id: outcomeRun.id,
          action_id: String(outcome.action_id),
          outcome_at: String(outcome.outcome_at),
          assessment: assessmentValue,
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

  const notificationSync = await syncPrototypeLearningNotifications(String(assessmentRun.id), priorAssessmentIds)
  return NextResponse.json({ assessment: assessmentRun, created: true, ...notificationSync }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
