import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { buildExecutiveAttentionQueue, sortExecutiveAttentionItems, type ExecutiveAttentionItem } from "@/lib/intelligence/executive-attention"
import { buildOpportunityAttentionItems } from "@/lib/intelligence/opportunity-attention"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { collapseSnifaRegulatoryEvents } from "@/lib/intelligence/snifa-regulatory-timeline"
import { triageWatchTasks } from "@/lib/intelligence/watch-task-triage"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CLASS_EXPANSION_PREFIX = "Expansión competitiva Nice:"

type RegulatoryTimeline = {
  canonicalCompanyName: string | null
  expediente: string
  milestones: Array<{
    id: string
    label: string
    title: string
    detail: string | null
    occurredAt: string | null
    href: string | null
    relevance: "alta" | "media" | "baja"
  }>
  assessment: {
    latestStage: string
    latestStageLabel: string
    latestMovementAt: string | null
    direction: "observacion" | "escalando" | "mitigacion" | "materializado"
    attention: "alta" | "media"
    durationDays: number | null
    rationale: string
  }
}

type CommonSignal = {
  key: string
  watchKey: string
  type: "brand" | "patent" | "technology"
  watchQuery: string
  source: string
  title: string
  detail: string | null
  occurredAt: string | null
  firstSeenAt: string
  relevance: "alta" | "media" | "baja"
  isNew: boolean
  href: string
  timeline?: RegulatoryTimeline | null
  duplicateCount?: number
  groupedKeys?: string[]
}

type CorroborationEvidence = {
  source?: unknown
  sourceRecordId?: unknown
  title?: unknown
  date?: unknown
  url?: unknown
  activity?: unknown
  directness?: unknown
  matchedTerms?: unknown
}

type CorroborationRow = {
  signal_event_id: string
  status: string
  evidence_state: string | null
  new_nice_classes: number[] | null
  activity_types: string[] | null
  evidence: CorroborationEvidence[] | null
  source_coverage: Record<string, { available?: unknown; evidence_count?: unknown }> | null
  last_error: string | null
  completed_at: string | null
}

type HypothesisMonitoringRow = {
  id: string
  hypothesis_id: string
  assessment: string
  summary: string
  observed_at: string
}

type CompetitiveHypothesisRow = {
  id: string
  signal_event_id: string
  status: string
  hypothesis: string
  decided_at: string | null
}

type HypothesisSignalRow = {
  id: string
  watch_id: string
  mark_name: string | null
  applicant_name: string | null
  source_url: string | null
}

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const admin = createAdminClient()

  const [brandWatchesResult, patentWatchesResult, technologyWatchesResult, brandEventsResult, patentEventsResult, technologyEventsResult, portfolioOrganizations] = await Promise.all([
    auth.supabase.from("trademark_watches").select("id,query,is_active,last_reviewed_at").eq("user_id", auth.user.id),
    auth.supabase.from("patent_watches").select("id,query,is_active,source_type,source_status").eq("user_id", auth.user.id),
    auth.supabase.from("intelligence_watches").select("id,query,is_active,last_reviewed_at").eq("user_id", auth.user.id),
    auth.supabase.from("trademark_watch_signal_events").select("id,watch_id,source,mark_name,applicant_name,application_number,event_date,source_url,relevance,reason,first_seen_at").eq("user_id", auth.user.id).order("first_seen_at", { ascending: false }).limit(150),
    auth.supabase.from("patent_alert_events").select("id,watch_id,title,application_number,applicants,ipc_codes,filing_date,detected_at,read_at,source_key,source_url,source_date").eq("user_id", auth.user.id).order("detected_at", { ascending: false }).limit(150),
    auth.supabase.from("intelligence_watch_events").select("id,watch_id,source_key,event_type,title,summary,source_url,occurred_at,relevance,first_seen_at,payload").eq("user_id", auth.user.id).order("first_seen_at", { ascending: false }).limit(150),
    listPortfolioOrganizations(admin, auth.user.id),
  ])

  const failed = [brandWatchesResult.error, patentWatchesResult.error, technologyWatchesResult.error, brandEventsResult.error, patentEventsResult.error, technologyEventsResult.error].find(Boolean)
  if (failed) {
    console.error("[common-watch-signals:get]", failed)
    return NextResponse.json({ error: "No pudimos construir el inbox completo de vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const brandWatches = new Map((brandWatchesResult.data ?? []).map(item => [item.id, item]))
  const patentWatches = new Map((patentWatchesResult.data ?? []).map(item => [item.id, item]))
  const technologyWatches = new Map((technologyWatchesResult.data ?? []).map(item => [item.id, item]))
  const technologyEvents = collapseSnifaRegulatoryEvents((technologyEventsResult.data ?? []).map(row => ({ ...row, relevance: row.relevance ?? null })))

  const rawSignals: CommonSignal[] = [
    ...(brandEventsResult.data ?? []).flatMap(row => {
      const watch = brandWatches.get(row.watch_id)
      if (!watch?.is_active) return []
      const isNew = Boolean(watch.last_reviewed_at && Date.parse(row.first_seen_at) > Date.parse(watch.last_reviewed_at))
      const isClassExpansion = typeof row.reason === "string" && row.reason.startsWith(CLASS_EXPANSION_PREFIX)
      return [{
        key: `brand:${row.id}`,
        watchKey: `brand:${row.watch_id}`,
        type: "brand" as const,
        watchQuery: watch.query,
        source: isClassExpansion ? "INAPI · Expansión competitiva" : row.source,
        title: isClassExpansion ? `Expansión competitiva · ${row.mark_name}` : row.mark_name,
        detail: row.reason || row.applicant_name || row.application_number,
        occurredAt: row.event_date,
        firstSeenAt: row.first_seen_at,
        relevance: normalizeRelevance(row.relevance),
        isNew,
        href: row.source_url || "/monitorear",
      }]
    }),
    ...(patentEventsResult.data ?? []).flatMap(row => {
      const watch = patentWatches.get(row.watch_id)
      if (!watch?.is_active) return []
      const isWipo = row.source_key === "wipo_patentscope_rss"
      return [{
        key: `patent:${row.id}`,
        watchKey: `patent:${row.watch_id}`,
        type: "patent" as const,
        watchQuery: watch.query,
        source: isWipo ? "WIPO · PATENTSCOPE RSS" : "INAPI · Patentes",
        title: row.title,
        detail: [row.applicants, row.application_number ? `${isWipo ? "Publicación" : "Solicitud"} ${row.application_number}` : null, Array.isArray(row.ipc_codes) && row.ipc_codes.length ? `IPC ${row.ipc_codes.slice(0, 4).join(", ")}` : null].filter(Boolean).join(" · ") || null,
        occurredAt: row.source_date || row.filing_date,
        firstSeenAt: row.detected_at,
        relevance: "media" as const,
        isNew: !row.read_at,
        href: row.source_url || (isWipo ? "/patentes/wipo" : "/patentes"),
      }]
    }),
    ...technologyEvents.flatMap(row => {
      const watch = technologyWatches.get(row.watch_id)
      if (!watch?.is_active) return []
      const isNew = Boolean(watch.last_reviewed_at && Date.parse(row.first_seen_at) > Date.parse(watch.last_reviewed_at))
      return [{
        key: `technology:${row.id}`,
        watchKey: `technology:${row.watch_id}`,
        type: "technology" as const,
        watchQuery: watch.query,
        source: row.timeline ? "SMA · línea regulatoria" : row.source_key,
        title: row.title,
        detail: row.summary || row.event_type,
        occurredAt: row.occurred_at,
        firstSeenAt: row.first_seen_at,
        relevance: normalizeRelevance(row.relevance),
        isNew,
        href: row.source_url || "/monitorear/estrategico",
        timeline: row.timeline ? {
          canonicalCompanyName: row.timeline.canonicalCompanyName,
          expediente: row.timeline.expediente,
          milestones: row.timeline.milestones.map(item => ({
            id: item.id,
            label: item.label,
            title: item.title,
            detail: item.detail,
            occurredAt: item.occurredAt,
            href: item.href,
            relevance: item.relevance,
          })),
          assessment: row.timeline.assessment,
        } : null,
      }]
    }),
  ].sort((a, b) => Number(b.isNew) - Number(a.isNew) || relevanceRank(b.relevance) - relevanceRank(a.relevance) || Date.parse(b.firstSeenAt) - Date.parse(a.firstSeenAt))

  const triage = triageWatchTasks(rawSignals)
  const historical = rawSignals.filter(item => !item.isNew)
  const informational = triage.information.map(item => ({ ...item, isNew: false }))
  const signals: CommonSignal[] = [...triage.tasks, ...informational, ...historical]
    .sort((a, b) => Number(b.isNew) - Number(a.isNew) || relevanceRank(b.relevance) - relevanceRank(a.relevance) || Date.parse(b.firstSeenAt) - Date.parse(a.firstSeenAt))

  const [opportunityAttention, hypothesisAttention] = await Promise.all([
    loadOpportunityAttention(admin, portfolioOrganizations.map(item => item.id)),
    loadCompetitiveHypothesisAttention(admin, auth.user.id),
  ])
  const baseAttentionQueue = sortExecutiveAttentionItems([
    ...buildExecutiveAttentionQueue(signals),
    ...opportunityAttention,
    ...hypothesisAttention,
  ])
  const corroborations = await loadExpansionCorroborations(admin, auth.user.id, baseAttentionQueue)
  const attentionQueue = baseAttentionQueue.map(item => item.kind === "competitive_expansion"
    ? { ...item, corroboration: corroborations.get(brandEventId(item.signalKey)) ?? null }
    : item)

  return NextResponse.json({
    signals,
    attentionQueue,
    attentionSummary: {
      total: attentionQueue.length,
      critical: attentionQueue.filter(item => item.priority === "critica").length,
      high: attentionQueue.filter(item => item.priority === "alta").length,
      medium: attentionQueue.filter(item => item.priority === "media").length,
      opportunity: opportunityAttention.length,
      hypothesisReview: hypothesisAttention.length,
    },
    triage: {
      rawPending: triage.rawPendingCount,
      actionableTasks: triage.tasks.length,
      informational: triage.information.length,
      duplicatesCollapsed: triage.hiddenDuplicateCount,
    },
    summary: {
      new: triage.tasks.length,
      high: triage.tasks.filter(item => item.relevance === "alta").length,
      total: signals.length,
      brand: signals.filter(item => item.type === "brand").length,
      patent: signals.filter(item => item.type === "patent").length,
      technology: signals.filter(item => item.type === "technology").length,
    },
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const reviewedAt = new Date().toISOString()
  const [brandResult, technologyResult, patentResult] = await Promise.all([
    auth.supabase.from("trademark_watches").update({ last_reviewed_at: reviewedAt }).eq("user_id", auth.user.id).eq("is_active", true),
    auth.supabase.from("intelligence_watches").update({ last_reviewed_at: reviewedAt, updated_at: reviewedAt }).eq("user_id", auth.user.id).eq("is_active", true),
    auth.supabase.from("patent_alert_events").update({ read_at: reviewedAt }).eq("user_id", auth.user.id).is("read_at", null),
  ])
  const failed = [brandResult.error, technologyResult.error, patentResult.error].find(Boolean)
  if (failed) { console.error("[common-watch-signals:review]", failed); return NextResponse.json({ error: "No pudimos registrar la revisión completa." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS }) }
  return NextResponse.json({ ok: true, reviewedAt }, { headers: PRIVATE_NO_STORE_HEADERS })
}

async function loadCompetitiveHypothesisAttention(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<ExecutiveAttentionItem[]> {
  const { data: monitoringData, error: monitoringError } = await admin
    .from("competitive_hypothesis_monitoring_events")
    .select("id,hypothesis_id,assessment,summary,observed_at")
    .eq("user_id", userId)
    .eq("review_status", "pending")
    .neq("assessment", "no_material_change")
    .order("observed_at", { ascending: false })
    .limit(100)
  if (monitoringError) {
    console.error("[common-watch-signals:hypothesis-monitoring]", monitoringError)
    return []
  }

  const monitoringRows = (monitoringData ?? []) as HypothesisMonitoringRow[]
  const hypothesisIds = Array.from(new Set(monitoringRows.map(row => row.hypothesis_id).filter(Boolean)))
  if (!hypothesisIds.length) return []

  const { data: hypothesisData, error: hypothesisError } = await admin
    .from("competitive_hypotheses")
    .select("id,signal_event_id,status,hypothesis,decided_at")
    .eq("user_id", userId)
    .in("id", hypothesisIds)
    .eq("status", "accepted")
  if (hypothesisError) {
    console.error("[common-watch-signals:competitive-hypotheses]", hypothesisError)
    return []
  }

  const hypotheses = (hypothesisData ?? []) as CompetitiveHypothesisRow[]
  const hypothesesById = new Map(hypotheses.map(row => [row.id, row]))
  const signalIds = Array.from(new Set(hypotheses.map(row => row.signal_event_id).filter(Boolean)))
  if (!signalIds.length) return []

  const { data: signalData, error: signalError } = await admin
    .from("trademark_watch_signal_events")
    .select("id,watch_id,mark_name,applicant_name,source_url")
    .eq("user_id", userId)
    .in("id", signalIds)
  if (signalError) {
    console.error("[common-watch-signals:hypothesis-signals]", signalError)
    return []
  }

  const signalsById = new Map(((signalData ?? []) as HypothesisSignalRow[]).map(row => [row.id, row]))
  return monitoringRows.flatMap(row => {
    const hypothesis = hypothesesById.get(row.hypothesis_id)
    if (!hypothesis) return []
    const signal = signalsById.get(hypothesis.signal_event_id)
    if (!signal) return []
    const priority = hypothesisMonitoringPriority(row.assessment)
    const subject = signal.applicant_name || signal.mark_name || "Hipótesis competitiva"
    const label = hypothesisMonitoringLabel(row.assessment)
    const acceptedAt = hypothesis.decided_at ? ` Aceptada por una persona el ${formatDateForReason(hypothesis.decided_at)}.` : ""
    const reason = `${row.summary}${acceptedAt} Hipótesis vigente: ${truncateReason(hypothesis.hypothesis, 220)} Revisar la evidencia y registrar criterio humano; este seguimiento no modifica conviction ni la aceptación original.`

    return [{
      key: `attention:hypothesis-monitoring:${row.id}`,
      signalKey: `hypothesis-monitoring:${row.id}`,
      watchKey: `brand:${signal.watch_id}`,
      title: `${label} · ${subject}`,
      subject,
      source: "VIDENTIA · Seguimiento de hipótesis",
      href: "/monitorear/hipotesis",
      priority,
      reason,
      occurredAt: row.observed_at,
      isNew: true,
      kind: "new_high_signal" as const,
    }]
  })
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

function truncateReason(value: string, max: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`
}

function formatDateForReason(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}

async function loadExpansionCorroborations(admin: ReturnType<typeof createAdminClient>, userId: string, attentionQueue: ExecutiveAttentionItem[]) {
  const eventIds = attentionQueue
    .filter(item => item.kind === "competitive_expansion")
    .map(item => brandEventId(item.signalKey))
    .filter(Boolean)
  if (!eventIds.length) return new Map<string, ReturnType<typeof normalizeCorroboration>>()

  const { data, error } = await admin
    .from("trademark_expansion_corroborations")
    .select("signal_event_id,status,evidence_state,new_nice_classes,activity_types,evidence,source_coverage,last_error,completed_at")
    .eq("user_id", userId)
    .in("signal_event_id", eventIds)

  if (error) {
    console.error("[common-watch-signals:corroborations]", error)
    return new Map<string, ReturnType<typeof normalizeCorroboration>>()
  }

  return new Map(((data ?? []) as CorroborationRow[]).map(row => [row.signal_event_id, normalizeCorroboration(row)]))
}

function normalizeCorroboration(row: CorroborationRow) {
  return {
    status: allowedStatus(row.status),
    evidenceState: allowedEvidenceState(row.evidence_state),
    newNiceClasses: Array.isArray(row.new_nice_classes) ? row.new_nice_classes.filter(value => Number.isInteger(value) && value >= 1 && value <= 45) : [],
    activityTypes: Array.isArray(row.activity_types) ? row.activity_types.filter(value => typeof value === "string").slice(0, 12) : [],
    evidence: Array.isArray(row.evidence) ? row.evidence.flatMap(item => normalizeEvidence(item)).slice(0, 12) : [],
    sourceCoverage: normalizeSourceCoverage(row.source_coverage),
    lastError: typeof row.last_error === "string" ? row.last_error : null,
    completedAt: typeof row.completed_at === "string" ? row.completed_at : null,
  }
}

function normalizeEvidence(item: CorroborationEvidence) {
  const title = typeof item?.title === "string" ? item.title.trim() : ""
  if (!title) return []
  return [{
    source: typeof item.source === "string" ? item.source : "fuente_externa",
    title,
    date: typeof item.date === "string" ? item.date : null,
    url: typeof item.url === "string" && /^https?:\/\//i.test(item.url) ? item.url : null,
    activity: typeof item.activity === "string" ? item.activity : null,
    directness: item.directness === "direct" ? "direct" : "indirect",
    matchedTerms: Array.isArray(item.matchedTerms) ? item.matchedTerms.filter(value => typeof value === "string").slice(0, 8) : [],
  }]
}

function normalizeSourceCoverage(value: CorroborationRow["source_coverage"]) {
  if (!value || typeof value !== "object") return []
  return Object.entries(value).slice(0, 12).map(([source, coverage]) => ({
    source,
    available: coverage?.available === true,
    evidenceCount: typeof coverage?.evidence_count === "number" && Number.isFinite(coverage.evidence_count) ? Math.max(0, Math.round(coverage.evidence_count)) : 0,
  }))
}

function allowedStatus(value: string) {
  return (["pending", "running", "completed", "partial", "failed"] as const).find(item => item === value) ?? "pending"
}

function allowedEvidenceState(value: string | null) {
  return (["supporting_evidence", "mixed_evidence", "insufficient_evidence", "not_observed"] as const).find(item => item === value) ?? null
}

function brandEventId(signalKey: string) {
  return signalKey.startsWith("brand:") ? signalKey.slice("brand:".length) : ""
}

async function loadOpportunityAttention(admin: ReturnType<typeof createAdminClient>, organizationIds: string[]) {
  if (!organizationIds.length) return []
  const { data: opportunities, error: opportunityError } = await admin
    .from("innovation_opportunity_theses")
    .select("id,title,status")
    .in("organization_id", organizationIds)
    .in("status", ["exploring", "watching", "prototype"])
    .order("updated_at", { ascending: false })
    .limit(100)
  if (opportunityError) {
    console.error("[common-watch-signals:opportunities]", opportunityError)
    throw new Error("Could not load organization opportunity theses")
  }
  const thesisIds = (opportunities ?? []).map(item => String(item.id))
  if (!thesisIds.length) return []

  const { data: researchRuns, error: researchError } = await admin
    .from("innovation_opportunity_research_runs")
    .select("id,opportunity_id,run_type,evidence_summary,observed_at")
    .in("organization_id", organizationIds)
    .in("opportunity_id", thesisIds)
    .order("observed_at", { ascending: false })
    .limit(500)
  if (researchError) {
    console.error("[common-watch-signals:opportunity-research]", researchError)
    throw new Error("Could not load opportunity conviction history")
  }

  return buildOpportunityAttentionItems(
    (opportunities ?? []).map(item => ({ id: String(item.id), title: String(item.title), status: String(item.status) })),
    (researchRuns ?? []).map(item => ({
      id: String(item.id),
      opportunity_id: String(item.opportunity_id),
      run_type: String(item.run_type),
      evidence_summary: item.evidence_summary,
      observed_at: String(item.observed_at),
    })),
  )
}

function normalizeRelevance(value: string | null): "alta" | "media" | "baja" { if (value === "alta" || value === "baja") return value; return "media" }
function relevanceRank(value: CommonSignal["relevance"]) { return value === "alta" ? 3 : value === "media" ? 2 : 1 }