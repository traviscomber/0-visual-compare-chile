import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import {
  compareOpportunityMarketStates,
  degradeOpportunityDecision,
  isOpportunityMarketState,
  observeOpportunityMarketState,
  type ConvictionScores,
  type OpportunityMarketState,
} from "@/lib/intelligence/opportunity-conviction"
import { assertPortfolioOrganizationAccess } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const RequestSchema = z.object({ organizationId: z.string().uuid() })

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

  const { data: thesisRow, error: thesisError } = await admin
    .from("innovation_opportunity_theses")
    .select("id,organization_id,status,decision,evidence_state,confidence,overall_score,evidence_strength,timing_score,strategic_fit,capability_reuse_score,novelty_score,defensibility_score,research_queries,thesis,last_researched_at")
    .eq("id", id)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle()

  if (thesisError) {
    console.error("[opportunity-theses:research:load]", thesisError)
    return NextResponse.json({ error: "No pudimos cargar la tesis." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!thesisRow) return NextResponse.json({ error: "Tesis no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  if (["rejected", "archived"].includes(String(thesisRow.status))) {
    return NextResponse.json({ error: "La tesis está cerrada. Reactívala antes de investigar nuevamente." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const query = Array.isArray(thesisRow.research_queries) ? String(thesisRow.research_queries[0] ?? "").trim() : ""
  if (!query) {
    return NextResponse.json({ error: "La tesis no tiene un research probe válido." }, { status: 422, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data: historyRows, error: historyError } = await admin
    .from("innovation_opportunity_research_runs")
    .select("id,evidence_summary,score_snapshot,confidence,observed_at,run_type")
    .eq("opportunity_id", id)
    .eq("organization_id", parsed.data.organizationId)
    .order("observed_at", { ascending: false })
    .limit(30)

  if (historyError) {
    console.error("[opportunity-theses:research:history]", historyError)
    return NextResponse.json({ error: "No pudimos reconstruir el historial de convicción." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const previousState = findLatestMarketState(historyRows ?? [])
  let observation: Awaited<ReturnType<typeof observeOpportunityMarketState>>
  try {
    observation = await observeOpportunityMarketState(query)
  } catch (error) {
    console.error("[opportunity-theses:research:observe]", error)
    return NextResponse.json({ error: "Las fuentes de investigación no respondieron de forma suficiente. La convicción no fue modificada." }, { status: 502, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const beforeScores: ConvictionScores = {
    strategic_fit: Number(thesisRow.strategic_fit),
    capability_reuse: Number(thesisRow.capability_reuse_score),
    novelty: Number(thesisRow.novelty_score),
    timing: Number(thesisRow.timing_score),
    evidence_strength: Number(thesisRow.evidence_strength),
    defensibility: Number(thesisRow.defensibility_score),
    overall: Number(thesisRow.overall_score),
  }
  const beforeConfidence = Number(thesisRow.confidence)
  const { comparison, scores, confidence } = compareOpportunityMarketStates(previousState, observation.state, beforeScores, beforeConfidence)
  const currentDecision = thesisRow.decision as "build" | "investigate" | "watch" | "reject"
  const evidenceState = thesisRow.evidence_state as "observed" | "mixed" | "hypothesis"
  const nextEvidenceState = evidenceState === "hypothesis" && observation.state.available_axes > 0 ? "mixed" as const : evidenceState
  const decision = degradeOpportunityDecision(currentDecision, nextEvidenceState, scores.evidence_strength, confidence)
  const thesisJson = asRecord(thesisRow.thesis)
  const thesisScores = asRecord(thesisJson.scores)
  const nextThesis = {
    ...thesisJson,
    decision,
    evidence_state: nextEvidenceState,
    confidence,
    scores: {
      ...thesisScores,
      strategic_fit: scores.strategic_fit,
      capability_reuse: scores.capability_reuse,
      novelty: scores.novelty,
      timing: scores.timing,
      evidence_strength: scores.evidence_strength,
      defensibility: scores.defensibility,
      overall: scores.overall,
    },
  }

  const observedAt = observation.state.observed_at
  const rollback = {
    decision: currentDecision,
    evidence_state: evidenceState,
    confidence: beforeConfidence,
    overall_score: beforeScores.overall,
    evidence_strength: beforeScores.evidence_strength,
    timing_score: beforeScores.timing,
    thesis: thesisJson,
    last_researched_at: thesisRow.last_researched_at,
  }

  const { error: updateError } = await admin
    .from("innovation_opportunity_theses")
    .update({
      decision,
      evidence_state: nextEvidenceState,
      confidence,
      overall_score: scores.overall,
      evidence_strength: scores.evidence_strength,
      timing_score: scores.timing,
      thesis: nextThesis,
      last_researched_at: observedAt,
    })
    .eq("id", id)
    .eq("organization_id", parsed.data.organizationId)

  if (updateError) {
    console.error("[opportunity-theses:research:update]", updateError)
    return NextResponse.json({ error: "La investigación terminó, pero no pudimos aplicar el nuevo snapshot. La tesis no fue modificada." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data: researchRun, error: runError } = await admin
    .from("innovation_opportunity_research_runs")
    .insert({
      opportunity_id: id,
      organization_id: parsed.data.organizationId,
      run_type: "live_research",
      research_queries: [query],
      evidence_summary: {
        market_state: observation.state,
        facts: observation.facts,
        comparison,
        previous_market_state_observed_at: previousState?.observed_at ?? null,
        news_non_scoring: true,
      },
      score_snapshot: scores,
      confidence,
      observed_at: observedAt,
      created_by: auth.user.id,
    })
    .select("id,run_type,evidence_summary,score_snapshot,confidence,observed_at")
    .single()

  if (runError || !researchRun) {
    console.error("[opportunity-theses:research:snapshot]", runError)
    const { error: rollbackError } = await admin
      .from("innovation_opportunity_theses")
      .update(rollback)
      .eq("id", id)
      .eq("organization_id", parsed.data.organizationId)
    if (rollbackError) console.error("[opportunity-theses:research:rollback]", rollbackError)
    return NextResponse.json({ error: "No pudimos guardar la trazabilidad del research; el cambio de convicción fue revertido." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({
    opportunity: {
      id,
      decision,
      evidence_state: nextEvidenceState,
      confidence,
      overall_score: scores.overall,
      evidence_strength: scores.evidence_strength,
      timing_score: scores.timing,
      last_researched_at: observedAt,
    },
    research: researchRun,
    comparison,
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function findLatestMarketState(rows: Array<Record<string, unknown>>): OpportunityMarketState | null {
  for (const row of rows) {
    const evidence = asRecord(row.evidence_summary)
    if (isOpportunityMarketState(evidence.market_state)) return evidence.market_state
  }
  return null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
