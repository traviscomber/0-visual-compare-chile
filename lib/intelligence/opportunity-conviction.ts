import { buildTechnologySignals } from "@/lib/intelligence/technology-signals"

export const CONVICTION_RESEARCH_WINDOW_DAYS = 180

export type ConvictionScores = {
  strategic_fit: number
  capability_reuse: number
  novelty: number
  timing: number
  evidence_strength: number
  defensibility: number
  overall: number
}

export type OpportunityMarketState = {
  observed_at: string
  query: string
  corroboration_status: "corroborada" | "parcial" | "sin_senal" | "insuficiente"
  confirming_axes: number
  available_axes: number
  current_publications: number | null
  previous_publications: number | null
  change_percent: number | null
  trend: "acelerando" | "estable" | "desacelerando" | "sin_base" | "no_disponible"
  patent_recent_matches: number
  patent_selected_matches: number
  patent_distinct_applicants: number
  patent_latest_filing_date: string | null
  sources: {
    openalex: boolean
    crossref: boolean
    inapi_patents: boolean
    gdelt: boolean
  }
  news_context_count: number
}

export type ConvictionComparison = {
  baseline: boolean
  evidence_delta: number
  timing_delta: number
  confidence_delta: number
  overall_delta: number
  direction: "strengthening" | "weakening" | "stable" | "baseline"
  reasons: string[]
  news_non_scoring: true
}

export async function observeOpportunityMarketState(query: string): Promise<{ state: OpportunityMarketState; facts: string[] }> {
  const signals = await buildTechnologySignals(query, CONVICTION_RESEARCH_WINDOW_DAYS, "both")
  const state: OpportunityMarketState = {
    observed_at: signals.observed_at,
    query,
    corroboration_status: signals.corroboration.status,
    confirming_axes: signals.corroboration.confirming_axes,
    available_axes: signals.corroboration.available_axes,
    current_publications: signals.momentum.current_publications,
    previous_publications: signals.momentum.previous_publications,
    change_percent: signals.momentum.change_percent,
    trend: signals.momentum.trend,
    patent_recent_matches: signals.patent_signal.recent_matches,
    patent_selected_matches: signals.patent_signal.selected_matches,
    patent_distinct_applicants: signals.patent_signal.distinct_applicants,
    patent_latest_filing_date: signals.patent_signal.latest_filing_date,
    sources: {
      openalex: signals.sources.openalex.available,
      crossref: signals.sources.crossref.available,
      inapi_patents: signals.sources.inapi_patents.available,
      gdelt: signals.sources.gdelt.available,
    },
    news_context_count: signals.sources.gdelt.evidence_count,
  }

  return { state, facts: buildMarketFacts(state) }
}

export function compareOpportunityMarketStates(
  previous: OpportunityMarketState | null,
  current: OpportunityMarketState,
  beforeScores: ConvictionScores,
  beforeConfidence: number,
): { comparison: ConvictionComparison; scores: ConvictionScores; confidence: number } {
  if (!previous) {
    return {
      comparison: {
        baseline: true,
        evidence_delta: 0,
        timing_delta: 0,
        confidence_delta: 0,
        overall_delta: 0,
        direction: "baseline",
        reasons: ["Baseline estructurado establecido. La primera observación persistente no mueve la convicción."],
        news_non_scoring: true,
      },
      scores: { ...beforeScores, overall: weightedOverall(beforeScores) },
      confidence: beforeConfidence,
    }
  }

  let evidenceDelta = 0
  let timingDelta = 0
  const reasons: string[] = []

  // Corroboration only moves conviction when both observations had both hard axes available.
  if (previous.available_axes >= 2 && current.available_axes >= 2) {
    const corroborationDelta = corroborationRank(current.corroboration_status) - corroborationRank(previous.corroboration_status)
    if (corroborationDelta > 0) {
      evidenceDelta += 4
      timingDelta += 2
      reasons.push(`Corroboración mejoró de ${previous.corroboration_status} a ${current.corroboration_status}.`)
    } else if (corroborationDelta < 0) {
      evidenceDelta -= 5
      timingDelta -= 2
      reasons.push(`Corroboración bajó de ${previous.corroboration_status} a ${current.corroboration_status}.`)
    }
  } else if (previous.available_axes >= 2 && current.available_axes < 2) {
    reasons.push("Una fuente dura no estuvo disponible; VIDENTIA no penaliza la tesis por indisponibilidad de fuente.")
  }

  if (previous.sources.inapi_patents && current.sources.inapi_patents) {
    const patentDelta = current.patent_recent_matches - previous.patent_recent_matches
    if (patentDelta > 0) {
      const step = Math.min(4, patentDelta * 2)
      evidenceDelta += step
      timingDelta += Math.min(3, patentDelta)
      reasons.push(`Coincidencias patentarias recientes subieron de ${previous.patent_recent_matches} a ${current.patent_recent_matches}.`)
    } else if (patentDelta < 0) {
      const step = Math.min(4, Math.abs(patentDelta) * 2)
      evidenceDelta -= step
      timingDelta -= Math.min(3, Math.abs(patentDelta))
      reasons.push(`Coincidencias patentarias recientes bajaron de ${previous.patent_recent_matches} a ${current.patent_recent_matches}.`)
    }
  }

  if (previous.sources.openalex && current.sources.openalex) {
    const trendDelta = trendRank(current.trend) - trendRank(previous.trend)
    if (trendDelta > 0) {
      evidenceDelta += 2
      timingDelta += 3
      reasons.push(`Momentum científico mejoró de ${previous.trend} a ${current.trend}.`)
    } else if (trendDelta < 0) {
      evidenceDelta -= 2
      timingDelta -= 3
      reasons.push(`Momentum científico se debilitó de ${previous.trend} a ${current.trend}.`)
    } else if (current.current_publications !== null && previous.current_publications !== null) {
      const publicationDelta = current.current_publications - previous.current_publications
      const materialThreshold = Math.max(2, Math.ceil(Math.max(1, previous.current_publications) * 0.2))
      if (publicationDelta >= materialThreshold) {
        evidenceDelta += 2
        timingDelta += 1
        reasons.push(`Actividad científica observable aumentó de ${previous.current_publications} a ${current.current_publications} publicaciones en la ventana.`)
      } else if (publicationDelta <= -materialThreshold) {
        evidenceDelta -= 2
        timingDelta -= 1
        reasons.push(`Actividad científica observable cayó de ${previous.current_publications} a ${current.current_publications} publicaciones en la ventana.`)
      }
    }
  }

  evidenceDelta = clamp(Math.round(evidenceDelta), -8, 8)
  timingDelta = clamp(Math.round(timingDelta), -6, 6)
  const confidenceDelta = clamp(round4(evidenceDelta * 0.005 + timingDelta * 0.002), -0.05, 0.05)

  const scores: ConvictionScores = {
    ...beforeScores,
    evidence_strength: clamp(Math.round(beforeScores.evidence_strength + evidenceDelta), 0, 100),
    timing: clamp(Math.round(beforeScores.timing + timingDelta), 0, 100),
    overall: 0,
  }
  scores.overall = weightedOverall(scores)
  const confidence = clamp(round4(beforeConfidence + confidenceDelta), 0, 1)
  const overallDelta = scores.overall - beforeScores.overall
  const direction: ConvictionComparison["direction"] = overallDelta > 0
    ? "strengthening"
    : overallDelta < 0
      ? "weakening"
      : "stable"

  if (!reasons.length) reasons.push("No apareció un cambio material en los ejes duros respecto del snapshot anterior.")
  if (current.news_context_count !== previous.news_context_count) {
    reasons.push("El cambio en noticias se conserva como contexto y no altera el score de convicción.")
  }

  return {
    comparison: {
      baseline: false,
      evidence_delta: evidenceDelta,
      timing_delta: timingDelta,
      confidence_delta: confidenceDelta,
      overall_delta: overallDelta,
      direction,
      reasons,
      news_non_scoring: true,
    },
    scores,
    confidence,
  }
}

export function degradeOpportunityDecision(
  currentDecision: "build" | "investigate" | "watch" | "reject",
  evidenceState: "observed" | "mixed" | "hypothesis",
  evidenceStrength: number,
  confidence: number,
) {
  if (currentDecision === "reject") return currentDecision
  if (currentDecision === "build" && (evidenceStrength < 60 || confidence < 0.65 || evidenceState === "hypothesis")) return "investigate" as const
  if (currentDecision === "investigate" && evidenceStrength < 30 && confidence < 0.45) return "watch" as const
  // Persistent research can hold or downgrade a thesis, never auto-upgrade it to build/prototype.
  return currentDecision
}

export function isOpportunityMarketState(value: unknown): value is OpportunityMarketState {
  if (!value || typeof value !== "object") return false
  const row = value as Record<string, unknown>
  return typeof row.query === "string"
    && typeof row.observed_at === "string"
    && typeof row.corroboration_status === "string"
    && typeof row.available_axes === "number"
    && typeof row.patent_recent_matches === "number"
    && Boolean(row.sources && typeof row.sources === "object")
}

function buildMarketFacts(state: OpportunityMarketState) {
  const facts: string[] = []
  if (state.sources.openalex) {
    facts.push(`Investigación: ${state.current_publications ?? 0} publicaciones en ${CONVICTION_RESEARCH_WINDOW_DAYS} días; tendencia ${state.trend}${state.change_percent === null ? "" : ` (${state.change_percent > 0 ? "+" : ""}${state.change_percent}%)`}.`)
  } else {
    facts.push("OpenAlex no estuvo disponible; ese eje no modifica convicción.")
  }
  if (state.sources.inapi_patents) {
    facts.push(`INAPI: ${state.patent_recent_matches} coincidencias recientes, ${state.patent_selected_matches} antecedentes seleccionados y ${state.patent_distinct_applicants} solicitantes distintos.`)
  } else {
    facts.push("INAPI no estuvo disponible; ese eje no modifica convicción.")
  }
  facts.push(`Corroboración: ${state.corroboration_status} (${state.confirming_axes}/${state.available_axes} ejes confirman actividad).`)
  if (state.sources.gdelt) facts.push(`${state.news_context_count} señales de noticias conservadas sólo como contexto no puntuable.`)
  return facts
}

function weightedOverall(scores: ConvictionScores) {
  return clamp(Math.round(
    scores.strategic_fit * 0.25
    + scores.capability_reuse * 0.20
    + scores.novelty * 0.15
    + scores.timing * 0.15
    + scores.evidence_strength * 0.15
    + scores.defensibility * 0.10,
  ), 0, 100)
}

function corroborationRank(value: OpportunityMarketState["corroboration_status"]) {
  if (value === "corroborada") return 2
  if (value === "parcial") return 1
  return 0
}

function trendRank(value: OpportunityMarketState["trend"]) {
  if (value === "acelerando") return 2
  if (value === "sin_base") return 1
  if (value === "estable") return 0
  if (value === "desacelerando") return -1
  return 0
}

function round4(value: number) { return Math.round(value * 10_000) / 10_000 }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }
