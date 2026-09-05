import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DecisionSchema = z.object({
  organizationId: z.string().uuid(),
  target: z.enum(["exploring", "watching", "prototype", "rejected"]),
  rationale: z.string().trim().min(8).max(1000),
})

const targetDecision = {
  exploring: "investigate",
  watching: "watch",
  prototype: "build",
  rejected: "reject",
} as const

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const parsed = DecisionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Decisión, tesis u organización inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const access = await assertPortfolioOrganizationAccess(admin, auth.user.id, parsed.data.organizationId)
  if (!access.ok) return NextResponse.json({ error: "No perteneces a esta organización." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })

  const { data: current, error: loadError } = await admin
    .from("innovation_opportunity_theses")
    .select("id,organization_id,status,decision,evidence_state,confidence,overall_score,evidence_strength,timing_score,strategic_fit,capability_reuse_score,novelty_score,defensibility_score,thesis,last_researched_at")
    .eq("id", id)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle()

  if (loadError) {
    console.error("[opportunity-theses:decision:load]", loadError)
    return NextResponse.json({ error: "No pudimos cargar la tesis." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!current) return NextResponse.json({ error: "Tesis no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  if (current.status === "archived") {
    return NextResponse.json({ error: "La tesis está archivada y no admite decisiones operativas." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const sensitiveTarget = parsed.data.target === "prototype" || parsed.data.target === "rejected"
  const reopensClosedDecision = current.status === "rejected" && parsed.data.target !== "rejected"
  if ((sensitiveTarget || reopensClosedDecision) && access.role !== "admin") {
    return NextResponse.json({ error: "Esta decisión requiere rol administrador." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const nextDecision = targetDecision[parsed.data.target]
  if (current.status === parsed.data.target && current.decision === nextDecision) {
    return NextResponse.json({ opportunity: current, changed: false }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  const warning = buildEvidenceWarning({
    target: parsed.data.target,
    evidenceState: String(current.evidence_state),
    evidenceStrength: Number(current.evidence_strength),
    confidence: Number(current.confidence),
  })
  const thesis = asRecord(current.thesis)
  const nextThesis = { ...thesis, decision: nextDecision }
  const observedAt = new Date().toISOString()
  const rollback = { status: current.status, decision: current.decision, thesis }

  const { error: updateError } = await admin
    .from("innovation_opportunity_theses")
    .update({ status: parsed.data.target, decision: nextDecision, thesis: nextThesis })
    .eq("id", id)
    .eq("organization_id", parsed.data.organizationId)

  if (updateError) {
    console.error("[opportunity-theses:decision:update]", updateError)
    return NextResponse.json({ error: "No pudimos aplicar la decisión humana." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const scoreSnapshot = {
    strategic_fit: Number(current.strategic_fit),
    capability_reuse: Number(current.capability_reuse_score),
    novelty: Number(current.novelty_score),
    timing: Number(current.timing_score),
    evidence_strength: Number(current.evidence_strength),
    defensibility: Number(current.defensibility_score),
    overall: Number(current.overall_score),
  }
  const { data: audit, error: auditError } = await admin
    .from("innovation_opportunity_research_runs")
    .insert({
      opportunity_id: id,
      organization_id: parsed.data.organizationId,
      run_type: "human_review",
      research_queries: [],
      evidence_summary: {
        human_decision: {
          from_status: current.status,
          to_status: parsed.data.target,
          from_decision: current.decision,
          to_decision: nextDecision,
          rationale: parsed.data.rationale,
          evidence_warning: warning,
          actor_role: access.role,
        },
        scores_unchanged: true,
        trigger: "explicit_user_action",
      },
      score_snapshot: scoreSnapshot,
      confidence: Number(current.confidence),
      observed_at: observedAt,
      created_by: auth.user.id,
    })
    .select("id,run_type,evidence_summary,score_snapshot,confidence,observed_at")
    .single()

  if (auditError || !audit) {
    console.error("[opportunity-theses:decision:audit]", auditError)
    const { error: rollbackError } = await admin
      .from("innovation_opportunity_theses")
      .update(rollback)
      .eq("id", id)
      .eq("organization_id", parsed.data.organizationId)
    if (rollbackError) console.error("[opportunity-theses:decision:rollback]", rollbackError)
    return NextResponse.json({ error: "No pudimos guardar la trazabilidad; la decisión fue revertida." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({
    opportunity: {
      id,
      status: parsed.data.target,
      decision: nextDecision,
      evidence_state: current.evidence_state,
      confidence: Number(current.confidence),
      overall_score: Number(current.overall_score),
      evidence_strength: Number(current.evidence_strength),
      timing_score: Number(current.timing_score),
      last_researched_at: current.last_researched_at,
    },
    audit,
    evidence_warning: warning,
    changed: true,
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function buildEvidenceWarning(input: { target: string; evidenceState: string; evidenceStrength: number; confidence: number }) {
  if (input.target !== "prototype") return null
  const reasons: string[] = []
  if (input.evidenceStrength < 60) reasons.push(`evidencia ${input.evidenceStrength}/100 (<60)`)
  if (input.confidence < 0.65) reasons.push(`confianza ${Math.round(input.confidence * 100)}% (<65%)`)
  if (input.evidenceState === "hypothesis") reasons.push("tesis aún clasificada como hipótesis")
  return reasons.length
    ? `Prototipado aprobado por decisión humana pese a guardrails de evidencia: ${reasons.join(", ")}.`
    : null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
