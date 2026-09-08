import { loadAssistantExecutionMetricsSummary, type AssistantExecutionMetricsSummary } from "@/lib/intelligence/assistant-execution-metrics"
import { loadAssistantJuanWorkspace } from "@/lib/intelligence/assistant-juan-workspace"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import type { VidentiaImprovementCandidate } from "@/lib/intelligence/videntia-improvement-radar"
import { createAdminClient } from "@/lib/supabase/admin"

type JuanWorkspaceSnapshot = Awaited<ReturnType<typeof loadAssistantJuanWorkspace>>

export type VidentiaImprovementStatus = "detected" | "researching" | "proposed" | "approved" | "implemented" | "measured"

export type VidentiaImprovementLifecycleRow = {
  id: string
  candidate_key: string
  source_kind: VidentiaImprovementCandidate["sourceKind"]
  priority: VidentiaImprovementCandidate["priority"]
  confidence: VidentiaImprovementCandidate["confidence"]
  finding: string
  proposal: string
  expected_impact: string
  validation_plan: string
  source: string
  status: VidentiaImprovementStatus
  baseline_snapshot: Record<string, unknown>
  baseline_recorded_at: string | null
  approved_at: string | null
  decision_note: string | null
  implementation_ref: string | null
  implemented_at: string | null
  result_snapshot: Record<string, unknown>
  measured_at: string | null
  measurement_note: string | null
  updated_at: string
}

export async function syncVidentiaImprovementLifecycle(userId: string, candidates: VidentiaImprovementCandidate[]) {
  const admin = createAdminClient()
  const organizations = await listPortfolioOrganizations(admin, userId).catch(() => [])
  const organization = organizations[0] ?? null
  if (!organization) return { organization: null, rows: [] as VidentiaImprovementLifecycleRow[] }

  const candidateKeys = candidates.map(item => item.id)
  if (candidateKeys.length) {
    const { data: existing, error: existingError } = await admin
      .from("intelligence_videntia_improvements")
      .select("candidate_key")
      .eq("user_id", userId)
      .eq("organization_id", organization.id)
      .in("candidate_key", candidateKeys)

    if (existingError) {
      console.warn("[videntia-improvement-lifecycle] existing load failed", existingError.message)
    } else {
      const existingKeys = new Set((existing ?? []).map(item => item.candidate_key as string))
      const missing = candidates.filter(item => !existingKeys.has(item.id))
      if (missing.length) {
        const { error: insertError } = await admin.from("intelligence_videntia_improvements").insert(missing.map(item => ({
          user_id: userId,
          organization_id: organization.id,
          candidate_key: item.id,
          source_kind: item.sourceKind,
          priority: item.priority,
          confidence: item.confidence,
          finding: item.finding,
          proposal: item.proposal,
          expected_impact: item.expectedImpact,
          validation_plan: item.validation,
          source: item.source,
          status: "detected",
          human_decision_required: true,
          conviction_delta: 0,
          last_actor_id: userId,
          transition_note: "Detección idempotente desde el radar de mejora VIDENTIA.",
        })))
        if (insertError && insertError.code !== "23505") console.warn("[videntia-improvement-lifecycle] insert failed", insertError.message)
      }
    }
  }

  const { data, error } = await admin
    .from("intelligence_videntia_improvements")
    .select("id,candidate_key,source_kind,priority,confidence,finding,proposal,expected_impact,validation_plan,source,status,baseline_snapshot,baseline_recorded_at,approved_at,decision_note,implementation_ref,implemented_at,result_snapshot,measured_at,measurement_note,updated_at")
    .eq("user_id", userId)
    .eq("organization_id", organization.id)
    .order("updated_at", { ascending: false })
    .limit(50)

  if (error) {
    console.warn("[videntia-improvement-lifecycle] load failed", error.message)
    return { organization, rows: [] as VidentiaImprovementLifecycleRow[] }
  }

  return { organization, rows: (data ?? []) as VidentiaImprovementLifecycleRow[] }
}

export async function buildVidentiaImprovementSnapshot(userId: string, candidateKey: string) {
  const [workspace, assistant] = await Promise.all([
    loadAssistantJuanWorkspace(userId),
    loadAssistantExecutionMetricsSummary(userId, 7),
  ])
  return snapshotForCandidate(candidateKey, workspace, assistant)
}

export function snapshotForCandidate(candidateKey: string, workspace: JuanWorkspaceSnapshot, assistant: AssistantExecutionMetricsSummary): Record<string, unknown> {
  const summary = workspace.summary
  switch (candidateKey) {
    case "decision-cycle":
      return { pendingDecisions: summary.pendingDecisions, generatedAt: workspace.generatedAt }
    case "action-hygiene":
      return { overdueActions: summary.overdueActions, generatedAt: workspace.generatedAt }
    case "evidence-closure":
      return { researchingHandoffs: summary.researchingHandoffs, generatedAt: workspace.generatedAt }
    case "github-freshness":
      return { githubReposObserved: summary.githubReposObserved, acceptedProducts: summary.acceptedProducts, githubLatestObservedAt: summary.githubLatestObservedAt, generatedAt: workspace.generatedAt }
    case "paper-review-loop":
      return { subsectionNewPapersObserved: summary.subsectionNewPapersObserved, subsectionProductsWithFreshPapers: summary.subsectionProductsWithFreshPapers, subsectionPapersObserved: summary.subsectionPapersObserved, generatedAt: workspace.generatedAt }
    case "assistant-effectiveness":
      return assistantSnapshot(assistant)
    default:
      return { generatedAt: workspace.generatedAt, state: "candidate_not_in_current_measurement_map" }
  }
}

export function assistantSnapshot(summary: AssistantExecutionMetricsSummary) {
  return {
    windowDays: summary.windowDays,
    sampleSize: summary.sampleSize,
    measuredFrom: summary.measuredFrom,
    measuredTo: summary.measuredTo,
    p50DurationMs: summary.p50DurationMs,
    p95DurationMs: summary.p95DurationMs,
    averageToolCalls: summary.averageToolCalls,
    averageTotalTokens: summary.averageTotalTokens,
    usageCoverage: summary.usageCoverage,
    modes: summary.modes.map(item => ({
      mode: item.mode,
      requests: item.requests,
      p50DurationMs: item.p50DurationMs,
      p95DurationMs: item.p95DurationMs,
      averageToolCalls: item.averageToolCalls,
      averageTotalTokens: item.averageTotalTokens,
    })),
  }
}

export function hasMeaningfulAssistantBaseline(snapshot: Record<string, unknown>) {
  return typeof snapshot.sampleSize === "number" && snapshot.sampleSize >= 5
}
