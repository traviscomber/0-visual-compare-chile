import { createAdminClient } from "@/lib/supabase/admin"
import {
  buildExecutiveAttentionQueue,
  sortExecutiveAttentionItems,
  type ExecutiveAttentionItem,
  type ExecutiveAttentionSignal,
} from "@/lib/intelligence/executive-attention"
import {
  buildCompetitiveSituations,
  situationKey,
  type CompetitiveSituationSignal,
} from "@/lib/intelligence/competitive-situations"

const CLASS_EXPANSION_PREFIX = "Expansión competitiva Nice:"
const HYPOTHESIS_REVIEW_SOURCE = "VIDENTIA · Seguimiento de hipótesis"

type BrandWatchRow = {
  id: string
  query: string
  is_active: boolean
  last_reviewed_at: string | null
}

type BrandSignalRow = {
  id: string
  watch_id: string
  mark_name: string | null
  applicant_name: string | null
  reason: string | null
  event_date: string | null
  source_url: string | null
  relevance: string | null
  first_seen_at: string
}

type CorroborationEvidence = {
  source?: unknown
  title?: unknown
  date?: unknown
  url?: unknown
  activity?: unknown
  directness?: unknown
}

type CorroborationRow = {
  id: string
  signal_event_id: string
  status: string
  evidence_state: string | null
  new_nice_classes: number[] | null
  activity_types: string[] | null
  evidence: CorroborationEvidence[] | null
  source_coverage: Record<string, { available?: unknown; evidence_count?: unknown }> | null
  completed_at: string | null
}

type HypothesisRow = {
  id: string
  signal_event_id: string
  hypothesis: string
  evidence_for: unknown[] | null
  evidence_missing: unknown[] | null
  evidence_against: unknown[] | null
  decision_reason: string | null
  decided_at: string | null
}

type MonitoringRow = {
  id: string
  hypothesis_id: string
  assessment: string
  summary: string
  evidence_new: unknown[] | null
  evidence_contradictory: unknown[] | null
  source_coverage: Record<string, unknown> | null
  review_status: string
  review_reason: string | null
  reviewed_at: string | null
  next_review_at: string | null
  observed_at: string
}

type HypothesisDetail = {
  id: string
  signalEventId: string
  company: string
  hypothesis: string
  decisionReason: string | null
  decidedAt: string | null
  evidenceFor: unknown[]
  evidenceMissing: string[]
  evidenceAgainst: string[]
  latestMonitoring: ReturnType<typeof normalizeMonitoring> | null
}

export async function loadAssistantCompetitiveSituations(userId: string, maxResults = 8) {
  const admin = createAdminClient()
  const [watchesResult, signalsResult, hypothesesResult] = await Promise.all([
    admin.from("trademark_watches")
      .select("id,query,is_active,last_reviewed_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(100),
    admin.from("trademark_watch_signal_events")
      .select("id,watch_id,mark_name,applicant_name,reason,event_date,source_url,relevance,first_seen_at")
      .eq("user_id", userId)
      .order("first_seen_at", { ascending: false })
      .limit(150),
    admin.from("competitive_hypotheses")
      .select("id,signal_event_id,hypothesis,evidence_for,evidence_missing,evidence_against,decision_reason,decided_at")
      .eq("user_id", userId)
      .eq("status", "accepted")
      .order("decided_at", { ascending: false })
      .limit(80),
  ])

  const firstError = watchesResult.error || signalsResult.error || hypothesesResult.error
  if (firstError) {
    console.error("[assistant-competitive-situations:base]", firstError)
    throw new Error("Could not load canonical competitive situation context")
  }

  const watches = (watchesResult.data ?? []) as BrandWatchRow[]
  const signals = (signalsResult.data ?? []) as BrandSignalRow[]
  const hypotheses = (hypothesesResult.data ?? []) as HypothesisRow[]
  const watchesById = new Map(watches.map((row) => [row.id, row]))
  const signalsById = new Map(signals.map((row) => [row.id, row]))

  const expansionSignals: ExecutiveAttentionSignal[] = signals.flatMap((row) => {
    const watch = watchesById.get(row.watch_id)
    if (!watch || !isClassExpansion(row.reason)) return []
    const isNew = Boolean(watch.last_reviewed_at && safeTime(row.first_seen_at) > safeTime(watch.last_reviewed_at))
    return [{
      key: `brand:${row.id}`,
      watchKey: `brand:${row.watch_id}`,
      type: "brand" as const,
      watchQuery: watch.query,
      source: "INAPI · Expansión competitiva",
      title: `Expansión competitiva · ${row.mark_name || watch.query}`,
      detail: row.reason || row.applicant_name,
      occurredAt: row.event_date,
      firstSeenAt: row.first_seen_at,
      relevance: normalizeRelevance(row.relevance),
      isNew,
      href: row.source_url || "/monitorear/situaciones",
    }]
  })
  const expansionAttention = buildExecutiveAttentionQueue(expansionSignals)
    .filter((item) => item.kind === "competitive_expansion")

  const hypothesisIds = hypotheses.map((row) => row.id)
  const monitoringResult = hypothesisIds.length
    ? await admin.from("competitive_hypothesis_monitoring_events")
      .select("id,hypothesis_id,assessment,summary,evidence_new,evidence_contradictory,source_coverage,review_status,review_reason,reviewed_at,next_review_at,observed_at")
      .eq("user_id", userId)
      .in("hypothesis_id", hypothesisIds)
      .order("observed_at", { ascending: false })
      .limit(1200)
    : { data: [], error: null }

  if (monitoringResult.error) {
    console.error("[assistant-competitive-situations:monitoring]", monitoringResult.error)
    throw new Error("Could not load competitive hypothesis monitoring")
  }

  const monitoringRows = (monitoringResult.data ?? []) as MonitoringRow[]
  const latestMonitoring = new Map<string, MonitoringRow>()
  for (const row of monitoringRows) {
    if (!latestMonitoring.has(row.hypothesis_id)) latestMonitoring.set(row.hypothesis_id, row)
  }

  const hypothesisDetails: HypothesisDetail[] = hypotheses.flatMap((row) => {
    const signal = signalsById.get(row.signal_event_id)
    if (!signal) return []
    const company = signal.applicant_name || signal.mark_name || watchesById.get(signal.watch_id)?.query || "Competidor"
    const latest = latestMonitoring.get(row.id)
    return [{
      id: row.id,
      signalEventId: row.signal_event_id,
      company,
      hypothesis: row.hypothesis,
      decisionReason: row.decision_reason,
      decidedAt: row.decided_at,
      evidenceFor: Array.isArray(row.evidence_for) ? row.evidence_for.slice(0, 8) : [],
      evidenceMissing: strings(row.evidence_missing, 8),
      evidenceAgainst: strings(row.evidence_against, 8),
      latestMonitoring: latest ? normalizeMonitoring(latest) : null,
    }]
  })

  const hypothesisAttention: ExecutiveAttentionItem[] = hypothesisDetails.flatMap((detail) => {
    const latest = latestMonitoring.get(detail.id)
    if (!latest || latest.review_status !== "pending" || latest.assessment === "no_material_change") return []
    const signal = signalsById.get(detail.signalEventId)
    if (!signal) return []
    const priority = hypothesisMonitoringPriority(latest.assessment)
    const label = hypothesisMonitoringLabel(latest.assessment)
    const acceptedAt = detail.decidedAt ? ` Aceptada por una persona el ${formatDate(detail.decidedAt)}.` : ""
    return [{
      key: `attention:hypothesis-monitoring:${latest.id}`,
      signalKey: `hypothesis-monitoring:${latest.id}`,
      watchKey: `brand:${signal.watch_id}`,
      title: `${label} · ${detail.company}`,
      subject: detail.company,
      source: HYPOTHESIS_REVIEW_SOURCE,
      href: "/monitorear/hipotesis",
      priority,
      reason: `${latest.summary}${acceptedAt} Hipótesis vigente: ${truncate(detail.hypothesis, 220)} Revisar la evidencia y registrar criterio humano; este seguimiento no modifica conviction ni la aceptación original.`,
      occurredAt: latest.observed_at,
      isNew: true,
      kind: "new_high_signal" as const,
    }]
  })

  const attention = sortExecutiveAttentionItems([...expansionAttention, ...hypothesisAttention])
  const signalEventIds = Array.from(new Set([
    ...expansionAttention.map((item) => eventIdFromSignalKey(item.signalKey)),
    ...hypothesisDetails.map((item) => item.signalEventId),
  ].filter(Boolean)))

  const corroborationResult = signalEventIds.length
    ? await admin.from("trademark_expansion_corroborations")
      .select("id,signal_event_id,status,evidence_state,new_nice_classes,activity_types,evidence,source_coverage,completed_at")
      .eq("user_id", userId)
      .in("signal_event_id", signalEventIds)
    : { data: [], error: null }

  if (corroborationResult.error) {
    console.error("[assistant-competitive-situations:corroboration]", corroborationResult.error)
    throw new Error("Could not load competitive corroboration")
  }

  const corroborations = new Map(((corroborationResult.data ?? []) as CorroborationRow[]).map((row) => [row.signal_event_id, normalizeCorroboration(row)]))
  const situationSignals: CompetitiveSituationSignal[] = attention.map((item) => item.kind === "competitive_expansion"
    ? { ...item, corroboration: corroborations.get(eventIdFromSignalKey(item.signalKey)) ?? null }
    : item)
  const situations = buildCompetitiveSituations(situationSignals).slice(0, clamp(maxResults, 1, 12))

  const normalized = situations.map((situation) => {
    const expansions = situation.timeline.flatMap((item) => {
      if (item.kind !== "competitive_expansion") return []
      const eventId = eventIdFromSignalKey(item.signalKey)
      const signal = signalsById.get(eventId)
      if (!signal) return []
      return [{
        signalEventId: eventId,
        markName: signal.mark_name,
        applicantName: signal.applicant_name,
        eventDate: signal.event_date,
        reason: signal.reason,
        sourceUrl: safeUrl(signal.source_url),
        corroboration: corroborations.get(eventId) ?? null,
      }]
    })
    const acceptedHypotheses = hypothesisDetails.filter((item) => situationKey(item.company) === situation.key)
    return {
      key: situation.key,
      company: situation.subject,
      priority: situation.priority,
      latestOccurredAt: situation.latestOccurredAt,
      signalCount: situation.signalCount,
      activeHypothesisReviews: situation.activeHypothesisReviews,
      competitiveExpansions: situation.competitiveExpansions,
      decisionQuestion: situation.decisionQuestion,
      attentionReasons: situation.timeline.slice(0, 6).map((item) => ({
        title: item.title,
        source: item.source,
        priority: item.priority,
        reason: item.reason,
        occurredAt: item.occurredAt,
      })),
      expansions: expansions.slice(0, 4),
      acceptedHypotheses: acceptedHypotheses.slice(0, 4),
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      situations: normalized.length,
      highPriority: normalized.filter((item) => item.priority === "alta" || item.priority === "critica").length,
      pendingHypothesisReviews: normalized.reduce((sum, item) => sum + item.activeHypothesisReviews, 0),
      expansionSignals: normalized.reduce((sum, item) => sum + item.competitiveExpansions, 0),
      contradictory: normalized.reduce((sum, item) => sum + item.acceptedHypotheses.filter((hypothesis) => hypothesis.latestMonitoring?.assessment === "contradictory_signal" && hypothesis.latestMonitoring.reviewStatus === "pending").length, 0),
    },
    situations: normalized,
    decisionBoundary: "Canonical observations, corroboration, accepted hypotheses and monitoring are reported separately. This snapshot does not alter conviction, hypothesis acceptance, opportunity lifecycle or human decisions. Missing or unavailable evidence is neutral.",
  }
}

function normalizeCorroboration(row: CorroborationRow) {
  return {
    id: row.id,
    status: row.status,
    evidenceState: row.evidence_state,
    newNiceClasses: Array.isArray(row.new_nice_classes) ? row.new_nice_classes.filter((value) => Number.isInteger(value) && value >= 1 && value <= 45) : [],
    activityTypes: strings(row.activity_types, 12),
    evidence: Array.isArray(row.evidence) ? row.evidence.flatMap((item) => {
      const title = text(item?.title, 300)
      if (!title) return []
      return [{
        source: text(item.source, 100) || "fuente_externa",
        title,
        date: text(item.date, 40) || null,
        url: safeUrl(item.url),
        activity: text(item.activity, 100) || null,
        directness: item.directness === "direct" ? "direct" : "indirect",
      }]
    }).slice(0, 8) : [],
    sourceCoverage: row.source_coverage && typeof row.source_coverage === "object"
      ? Object.entries(row.source_coverage).slice(0, 12).map(([source, coverage]) => ({
        source,
        available: coverage?.available === true,
        evidenceCount: typeof coverage?.evidence_count === "number" && Number.isFinite(coverage.evidence_count) ? Math.max(0, Math.round(coverage.evidence_count)) : 0,
      }))
      : [],
    completedAt: row.completed_at,
  }
}

function normalizeMonitoring(row: MonitoringRow) {
  return {
    id: row.id,
    assessment: row.assessment,
    summary: row.summary,
    evidenceNew: Array.isArray(row.evidence_new) ? row.evidence_new.slice(0, 10) : [],
    evidenceContradictory: Array.isArray(row.evidence_contradictory) ? row.evidence_contradictory.slice(0, 8) : [],
    sourceCoverage: row.source_coverage && typeof row.source_coverage === "object" ? row.source_coverage : {},
    reviewStatus: row.review_status,
    reviewReason: row.review_reason,
    reviewedAt: row.reviewed_at,
    nextReviewAt: row.next_review_at,
    observedAt: row.observed_at,
  }
}

function isClassExpansion(reason: string | null) {
  return typeof reason === "string" && reason.startsWith(CLASS_EXPANSION_PREFIX)
}

function eventIdFromSignalKey(signalKey: string) {
  return signalKey.startsWith("brand:") ? signalKey.slice("brand:".length) : ""
}

function hypothesisMonitoringPriority(assessment: string): "alta" | "media" {
  return assessment === "strengthening_signal" || assessment === "contradictory_signal" ? "alta" : "media"
}

function hypothesisMonitoringLabel(assessment: string) {
  if (assessment === "strengthening_signal") return "Hipótesis gana evidencia"
  if (assessment === "contradictory_signal") return "Hipótesis recibe señal contradictoria"
  if (assessment === "source_degradation") return "Cobertura degradada"
  return "Hipótesis requiere revalidación"
}

function normalizeRelevance(value: string | null): "alta" | "media" | "baja" {
  if (value === "alta" || value === "baja") return value
  return "media"
}

function strings(value: unknown, limit: number) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, limit) : []
}

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : ""
}

function safeUrl(value: unknown) {
  const valueText = text(value, 800)
  return /^https?:\/\//i.test(valueText) ? valueText : null
}

function truncate(value: string, max: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}

function safeTime(value: string | null) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}
