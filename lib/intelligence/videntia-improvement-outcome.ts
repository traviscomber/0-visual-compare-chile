export type VidentiaImprovementOutcomeVerdict = "improved" | "neutral" | "worsened" | "insufficient_evidence"
export type VidentiaImprovementOutcomeConfidence = "high" | "medium" | "low"
export type VidentiaImprovementOutcomeScope = "operational_outcome" | "assistant_efficiency" | "measurement_only"

export type VidentiaImprovementMetricChange = {
  metric: string
  baseline: number
  result: number
  delta: number
  relativeDelta: number | null
  direction: "better" | "neutral" | "worse"
}

export type VidentiaImprovementOutcomeAssessment = {
  version: "v1"
  verdict: VidentiaImprovementOutcomeVerdict
  confidence: VidentiaImprovementOutcomeConfidence
  scope: VidentiaImprovementOutcomeScope
  reason: string
  changes: VidentiaImprovementMetricChange[]
  humanDecisionRequired: true
  decisionEffect: "none"
  convictionDelta: 0
}

const ASSISTANT_MATERIALITY = 0.1

export function assessVidentiaImprovementOutcome(input: {
  candidateKey: string
  baseline: Record<string, unknown>
  result: Record<string, unknown>
}): VidentiaImprovementOutcomeAssessment {
  const { candidateKey, baseline, result } = input

  switch (candidateKey) {
    case "decision-cycle":
      return assessLowerIsBetter({
        metric: "pendingDecisions",
        baseline,
        result,
        confidence: "medium",
        reasonLabel: "decisiones pendientes",
      })
    case "action-hygiene":
      return assessLowerIsBetter({
        metric: "overdueActions",
        baseline,
        result,
        confidence: "high",
        reasonLabel: "acciones vencidas",
      })
    case "evidence-closure":
      return assessLowerIsBetter({
        metric: "researchingHandoffs",
        baseline,
        result,
        confidence: "medium",
        reasonLabel: "líneas de investigación abiertas",
      })
    case "github-freshness":
      return assessGitHubCoverage(baseline, result)
    case "paper-review-loop":
      return insufficient(
        "measurement_only",
        "El número de papers observados no demuestra por sí solo que el ciclo de revisión técnica haya mejorado. Falta una métrica canónica de papers revisados, experimentos derivados o tiempo de cierre.",
      )
    case "assistant-effectiveness":
      return assessAssistantEfficiency(baseline, result)
    default:
      return insufficient("measurement_only", "Este tipo de mejora todavía no tiene una regla de evaluación causal versionada.")
  }
}

function assessLowerIsBetter(input: {
  metric: string
  baseline: Record<string, unknown>
  result: Record<string, unknown>
  confidence: VidentiaImprovementOutcomeConfidence
  reasonLabel: string
}): VidentiaImprovementOutcomeAssessment {
  const before = numeric(input.baseline, input.metric)
  const after = numeric(input.result, input.metric)
  if (before === null || after === null) {
    return insufficient("operational_outcome", `No hay una medición comparable de ${input.reasonLabel} antes y después.`)
  }

  const change = metricChange(input.metric, before, after, "lower")
  const verdict: VidentiaImprovementOutcomeVerdict = after < before ? "improved" : after > before ? "worsened" : "neutral"
  const reason = verdict === "improved"
    ? `${input.reasonLabel} bajaron de ${before} a ${after}.`
    : verdict === "worsened"
      ? `${input.reasonLabel} subieron de ${before} a ${after}.`
      : `${input.reasonLabel} se mantuvieron en ${after}.`

  return assessment(verdict, input.confidence, "operational_outcome", reason, [change])
}

function assessGitHubCoverage(baseline: Record<string, unknown>, result: Record<string, unknown>): VidentiaImprovementOutcomeAssessment {
  const beforeObserved = numeric(baseline, "githubReposObserved")
  const beforeProducts = numeric(baseline, "acceptedProducts")
  const afterObserved = numeric(result, "githubReposObserved")
  const afterProducts = numeric(result, "acceptedProducts")
  if (beforeObserved === null || beforeProducts === null || afterObserved === null || afterProducts === null || beforeProducts <= 0 || afterProducts <= 0) {
    return insufficient("operational_outcome", "No hay denominadores comparables para calcular cobertura GitHub antes y después.")
  }

  const beforeCoverage = beforeObserved / beforeProducts
  const afterCoverage = afterObserved / afterProducts
  const change = metricChange("githubCoverage", beforeCoverage, afterCoverage, "higher")
  const epsilon = 0.001
  const verdict: VidentiaImprovementOutcomeVerdict = afterCoverage > beforeCoverage + epsilon
    ? "improved"
    : afterCoverage < beforeCoverage - epsilon
      ? "worsened"
      : "neutral"
  const reason = `Cobertura GitHub ${formatPercent(beforeCoverage)} → ${formatPercent(afterCoverage)} sobre productos aceptados.`
  return assessment(verdict, "medium", "operational_outcome", reason, [change])
}

function assessAssistantEfficiency(baseline: Record<string, unknown>, result: Record<string, unknown>): VidentiaImprovementOutcomeAssessment {
  const beforeSample = numeric(baseline, "sampleSize")
  const afterSample = numeric(result, "sampleSize")
  if (beforeSample === null || afterSample === null || beforeSample < 5 || afterSample < 5) {
    return insufficient("assistant_efficiency", "Se requieren al menos 5 ejecuciones comparables tanto en baseline como después para evaluar eficiencia del Assistant.")
  }

  const candidates: Array<{ metric: string; lowerIsBetter: true; usable: boolean }> = [
    { metric: "p95DurationMs", lowerIsBetter: true, usable: true },
    { metric: "averageToolCalls", lowerIsBetter: true, usable: true },
    {
      metric: "averageTotalTokens",
      lowerIsBetter: true,
      usable: tokenUsageComparable(baseline, result),
    },
  ]

  const changes = candidates.flatMap(candidate => {
    if (!candidate.usable) return []
    const before = numeric(baseline, candidate.metric)
    const after = numeric(result, candidate.metric)
    if (before === null || after === null) return []
    return [metricChange(candidate.metric, before, after, "lower", ASSISTANT_MATERIALITY)]
  })

  if (changes.length < 2) {
    return insufficient("assistant_efficiency", "Faltan al menos dos métricas técnicas comparables del Assistant para atribuir un cambio de eficiencia.")
  }

  const materiallyBetter = changes.filter(change => change.direction === "better").length
  const materiallyWorse = changes.filter(change => change.direction === "worse").length
  const verdict: VidentiaImprovementOutcomeVerdict = materiallyBetter >= 2 && materiallyWorse === 0
    ? "improved"
    : materiallyWorse >= 2 && materiallyBetter === 0
      ? "worsened"
      : materiallyBetter === 0 && materiallyWorse === 0
        ? "neutral"
        : "insufficient_evidence"

  const reason = verdict === "improved"
    ? "La eficiencia técnica mejoró materialmente en al menos dos métricas sin regresión material en las demás."
    : verdict === "worsened"
      ? "La eficiencia técnica empeoró materialmente en al menos dos métricas sin mejora material compensatoria."
      : verdict === "neutral"
        ? "Las métricas técnicas comparables permanecieron dentro del umbral de ±10%."
        : "Las métricas técnicas se movieron en direcciones mixtas; no es seguro declarar mejora o deterioro."

  return assessment(verdict, verdict === "insufficient_evidence" ? "low" : "medium", "assistant_efficiency", reason, changes)
}

function tokenUsageComparable(baseline: Record<string, unknown>, result: Record<string, unknown>) {
  const beforeCoverage = numeric(baseline, "usageCoverage")
  const afterCoverage = numeric(result, "usageCoverage")
  return beforeCoverage !== null && afterCoverage !== null && beforeCoverage >= 0.8 && afterCoverage >= 0.8
}

function metricChange(metric: string, baseline: number, result: number, preference: "lower" | "higher", materiality = 0): VidentiaImprovementMetricChange {
  const delta = result - baseline
  const relativeDelta = baseline === 0 ? null : delta / Math.abs(baseline)
  const materiallyChanged = materiality === 0
    ? delta !== 0
    : relativeDelta !== null
      ? Math.abs(relativeDelta) >= materiality
      : Math.abs(delta) > 0

  let direction: VidentiaImprovementMetricChange["direction"] = "neutral"
  if (materiallyChanged) {
    const rawBetter = preference === "lower" ? result < baseline : result > baseline
    direction = rawBetter ? "better" : "worse"
  }

  return { metric, baseline, result, delta, relativeDelta, direction }
}

function assessment(
  verdict: VidentiaImprovementOutcomeVerdict,
  confidence: VidentiaImprovementOutcomeConfidence,
  scope: VidentiaImprovementOutcomeScope,
  reason: string,
  changes: VidentiaImprovementMetricChange[],
): VidentiaImprovementOutcomeAssessment {
  return {
    version: "v1",
    verdict,
    confidence,
    scope,
    reason,
    changes,
    humanDecisionRequired: true,
    decisionEffect: "none",
    convictionDelta: 0,
  }
}

function insufficient(scope: VidentiaImprovementOutcomeScope, reason: string): VidentiaImprovementOutcomeAssessment {
  return assessment("insufficient_evidence", "low", scope, reason, [])
}

function numeric(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
