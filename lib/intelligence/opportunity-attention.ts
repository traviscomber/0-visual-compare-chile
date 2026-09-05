import type { ExecutiveAttentionItem } from "@/lib/intelligence/executive-attention"

export const OPPORTUNITY_ATTENTION_THRESHOLDS = {
  evidence: 4,
  timing: 3,
  confidence: 0.025,
} as const

type OpportunityRow = {
  id: string
  title: string
  status: string
}

type ResearchRunRow = {
  id: string
  opportunity_id: string
  run_type: string
  evidence_summary: unknown
  observed_at: string
}

type Comparison = {
  baseline?: boolean
  evidence_delta?: number
  timing_delta?: number
  confidence_delta?: number
  overall_delta?: number
  direction?: "strengthening" | "weakening" | "stable" | "baseline"
  reasons?: string[]
}

export function buildOpportunityAttentionItems(
  opportunities: OpportunityRow[],
  researchRuns: ResearchRunRow[],
): ExecutiveAttentionItem[] {
  const runsByOpportunity = new Map<string, ResearchRunRow[]>()
  for (const run of researchRuns) {
    const current = runsByOpportunity.get(run.opportunity_id) ?? []
    current.push(run)
    runsByOpportunity.set(run.opportunity_id, current)
  }

  return opportunities.flatMap(opportunity => {
    if (["rejected", "archived"].includes(opportunity.status)) return []
    const runs = (runsByOpportunity.get(opportunity.id) ?? [])
      .sort((a, b) => safeTime(b.observed_at) - safeTime(a.observed_at))
    const latestHumanReview = runs.find(run => run.run_type === "human_review")
    const materialResearch = runs.find(run => isMaterialResearchRun(run))
    if (!materialResearch) return []
    if (latestHumanReview && safeTime(latestHumanReview.observed_at) >= safeTime(materialResearch.observed_at)) return []

    const evidence = asRecord(materialResearch.evidence_summary)
    const comparison = asComparison(evidence.comparison)
    if (!comparison) return []
    const decisionDegraded = evidence.decision_degraded === true
    const weakening = comparison.direction === "weakening" || decisionDegraded
    const strengthening = comparison.direction === "strengthening" && !decisionDegraded
    if (!weakening && !strengthening) return []

    const deltas = formatDeltas(comparison)
    const reasons = Array.isArray(comparison.reasons)
      ? comparison.reasons.filter(reason => typeof reason === "string" && reason.trim()).slice(0, 2)
      : []
    const title = decisionDegraded
      ? `Recomendación degradada · ${opportunity.title}`
      : weakening
        ? `Convicción bajó · ${opportunity.title}`
        : `Convicción subió · ${opportunity.title}`
    const reason = [
      decisionDegraded
        ? "El research degradó la recomendación automática; requiere criterio humano antes de continuar."
        : weakening
          ? "La evidencia dura debilitó materialmente esta tesis; requiere revisión humana del portfolio."
          : "La evidencia dura fortaleció materialmente esta tesis; conviene revisar si cambia la decisión humana.",
      deltas,
      ...reasons,
    ].filter(Boolean).join(" ")

    return [{
      key: `attention:opportunity:${materialResearch.id}`,
      signalKey: `opportunity:${materialResearch.id}`,
      watchKey: `opportunity:${opportunity.id}`,
      title,
      subject: opportunity.title,
      source: "Opportunity Engine",
      href: "/oportunidades/tesis",
      priority: weakening ? "alta" as const : "media" as const,
      reason,
      occurredAt: materialResearch.observed_at,
      isNew: true,
      kind: "opportunity_conviction" as const,
    }]
  })
}

export function isMaterialResearchRun(run: ResearchRunRow) {
  if (run.run_type !== "live_research" && run.run_type !== "scheduled_research") return false
  const evidence = asRecord(run.evidence_summary)
  const comparison = asComparison(evidence.comparison)
  if (!comparison || comparison.baseline || comparison.direction === "baseline" || comparison.direction === "stable") return false
  if (evidence.decision_degraded === true) return true
  return Math.abs(numberOrZero(comparison.evidence_delta)) >= OPPORTUNITY_ATTENTION_THRESHOLDS.evidence
    || Math.abs(numberOrZero(comparison.timing_delta)) >= OPPORTUNITY_ATTENTION_THRESHOLDS.timing
    || Math.abs(numberOrZero(comparison.confidence_delta)) >= OPPORTUNITY_ATTENTION_THRESHOLDS.confidence
}

function asComparison(value: unknown): Comparison | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const comparison = value as Comparison
  if (!comparison.direction) return null
  return comparison
}

function formatDeltas(comparison: Comparison) {
  const parts: string[] = []
  const evidence = numberOrZero(comparison.evidence_delta)
  const timing = numberOrZero(comparison.timing_delta)
  const confidence = numberOrZero(comparison.confidence_delta)
  if (evidence) parts.push(`evidencia ${signed(evidence)}`)
  if (timing) parts.push(`timing ${signed(timing)}`)
  if (confidence) parts.push(`confianza ${signed(Math.round(confidence * 1000) / 10)} pp`)
  return parts.length ? `Movimiento: ${parts.join(" · ")}.` : ""
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function numberOrZero(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function safeTime(value: string | null | undefined) {
  if (!value) return 0
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : 0
}
