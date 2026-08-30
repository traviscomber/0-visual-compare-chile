import type { SupabaseClient } from "@supabase/supabase-js"

export type IntelligenceCoverage = {
  latest_filing_date: string | null
  last_synced_at: string | null
  filing_lag_days: number | null
  sync_age_days: number | null
  synchronized_recently: boolean
  records_in_latest_30d: number
}

export type RecentCorpusActivity = {
  id: string
  kind: "patent" | "trademark"
  title: string
  actor: string | null
  filing_date: string
  source_url: string | null
}

export type ObservedSourceChange = {
  id: string
  kind: "patent" | "trademark"
  change_type: string
  title: string
  summary: string | null
  source_url: string | null
  source_date: string | null
  observed_at: string
  materiality: "alta" | "media" | "baja"
  changed_fields: string[]
}

export type StrategicChangeEvidencePreview = {
  id: string
  kind: "patent" | "trademark"
  change_type: string
  title: string
  summary: string | null
  source_url: string | null
  source_date: string | null
  observed_at: string
  role: string
}

export type StrategicChange = {
  id: string
  subject_name: string
  change_type: string
  title: string
  observed_fact: string
  interpretation: string
  why_it_matters: string
  materiality: "alta" | "media" | "baja"
  confidence: number
  event_count: number
  distinct_records: number
  patent_events: number
  trademark_events: number
  classification_codes: string[]
  period_start: string
  period_end: string
  first_observed_at: string
  last_observed_at: string
  evidence: StrategicChangeEvidencePreview[]
}

export type ChangeDetectionStatus = {
  ready: boolean
  baselines_ready: number
  baselines_expected: number
  states_total: number
  events_7d: number
  strategic_changes_7d: number
  last_observed_at: string | null
}

export type WeeklyBriefContext = {
  generated_at: string
  window_start: string
  window_end: string
  coverage: {
    patents: IntelligenceCoverage
    trademarks: IntelligenceCoverage
  }
  change_detection: ChangeDetectionStatus
  strategic_changes: StrategicChange[]
  observed_changes: ObservedSourceChange[]
  recent_activity: RecentCorpusActivity[]
}

type LatestPatentRow = { filing_date: string | null }
type LatestTrademarkRow = { fecha_presentacion: string | null }
type LatestSyncRow = { last_synced_at: string | null }
type PatentActivityRow = { id: string; title: string | null; applicants: string | null; filing_date: string | null; source_url: string | null }
type TrademarkActivityRow = { id: string; nombre: string | null; solicitante: string | null; fecha_presentacion: string | null; source_url: string | null }
type SourceChangeRow = {
  id: string
  entity_type: string
  event_type: string
  title: string | null
  summary: string | null
  source_url: string | null
  source_date: string | null
  observed_at: string
  materiality: string
  changed_fields: string[] | null
}
type StrategicChangeRow = {
  id: string
  subject_name: string
  change_type: string
  title: string
  observed_fact: string
  interpretation: string
  why_it_matters: string
  materiality: string
  confidence: number
  event_count: number
  distinct_records: number
  patent_events: number
  trademark_events: number
  classification_codes: string[] | null
  period_start: string
  period_end: string
  first_observed_at: string
  last_observed_at: string
}
type EvidenceLinkRow = { strategic_change_id: string; source_event_id: string; evidence_role: string }
type EvidenceEventRow = {
  id: string
  entity_type: string
  event_type: string
  title: string | null
  summary: string | null
  source_url: string | null
  source_date: string | null
  observed_at: string
}

const EXPECTED_CHANGE_BASELINES = 4

export async function buildWeeklyBriefContext(admin: SupabaseClient): Promise<WeeklyBriefContext> {
  const now = new Date()
  const windowEnd = isoDate(now)
  const windowStart = isoDate(addDays(now, -6))
  const windowStartTimestamp = `${windowStart}T00:00:00.000Z`

  const [patentLatestResult, trademarkLatestResult, patentSyncResult, trademarkSyncResult] = await Promise.all([
    admin.from("patent_records").select("filing_date").not("filing_date", "is", null).order("filing_date", { ascending: false }).limit(1).maybeSingle(),
    admin.from("trademark_records").select("fecha_presentacion").not("fecha_presentacion", "is", null).order("fecha_presentacion", { ascending: false }).limit(1).maybeSingle(),
    admin.from("patent_records").select("last_synced_at").not("last_synced_at", "is", null).order("last_synced_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("trademark_records").select("last_synced_at").not("last_synced_at", "is", null).order("last_synced_at", { ascending: false }).limit(1).maybeSingle(),
  ])

  logQueryError("patent latest coverage", patentLatestResult.error)
  logQueryError("trademark latest coverage", trademarkLatestResult.error)
  logQueryError("patent latest sync", patentSyncResult.error)
  logQueryError("trademark latest sync", trademarkSyncResult.error)

  const patentLatest = (patentLatestResult.data as LatestPatentRow | null)?.filing_date ?? null
  const trademarkLatest = (trademarkLatestResult.data as LatestTrademarkRow | null)?.fecha_presentacion ?? null
  const patentSync = (patentSyncResult.data as LatestSyncRow | null)?.last_synced_at ?? null
  const trademarkSync = (trademarkSyncResult.data as LatestSyncRow | null)?.last_synced_at ?? null

  const patentPeriodStart = patentLatest ? isoDate(addDays(new Date(`${patentLatest}T00:00:00Z`), -29)) : null
  const trademarkPeriodStart = trademarkLatest ? isoDate(addDays(new Date(`${trademarkLatest}T00:00:00Z`), -29)) : null

  const [patentCountResult, trademarkCountResult, patentsResult, trademarksResult, baselineCountResult, stateCountResult, observedChangesResult, strategicChangesResult] = await Promise.all([
    patentLatest && patentPeriodStart
      ? admin.from("patent_records").select("id", { count: "exact", head: true }).gte("filing_date", patentPeriodStart).lte("filing_date", patentLatest)
      : Promise.resolve({ count: 0, error: null }),
    trademarkLatest && trademarkPeriodStart
      ? admin.from("trademark_records").select("id", { count: "exact", head: true }).gte("fecha_presentacion", trademarkPeriodStart).lte("fecha_presentacion", trademarkLatest)
      : Promise.resolve({ count: 0, error: null }),
    admin.from("patent_records").select("id,title,applicants,filing_date,source_url").not("filing_date", "is", null).order("filing_date", { ascending: false }).limit(3),
    admin.from("trademark_records").select("id,nombre,solicitante,fecha_presentacion,source_url").not("fecha_presentacion", "is", null).order("fecha_presentacion", { ascending: false }).limit(3),
    admin.from("intelligence_change_baselines").select("source_key", { count: "exact", head: true }).eq("source_key", "inapi_open_data"),
    admin.from("intelligence_source_states").select("id", { count: "exact", head: true }).eq("source_key", "inapi_open_data"),
    admin.from("intelligence_source_events")
      .select("id,entity_type,event_type,title,summary,source_url,source_date,observed_at,materiality,changed_fields", { count: "exact" })
      .eq("source_key", "inapi_open_data")
      .gte("observed_at", windowStartTimestamp)
      .order("observed_at", { ascending: false })
      .limit(12),
    admin.from("intelligence_strategic_changes")
      .select("id,subject_name,change_type,title,observed_fact,interpretation,why_it_matters,materiality,confidence,event_count,distinct_records,patent_events,trademark_events,classification_codes,period_start,period_end,first_observed_at,last_observed_at", { count: "exact" })
      .gte("last_observed_at", windowStartTimestamp)
      .order("confidence", { ascending: false })
      .order("last_observed_at", { ascending: false })
      .limit(8),
  ])

  logQueryError("patent latest-period count", patentCountResult.error)
  logQueryError("trademark latest-period count", trademarkCountResult.error)
  logQueryError("patent recent activity", patentsResult.error)
  logQueryError("trademark recent activity", trademarksResult.error)
  logQueryError("change baseline count", baselineCountResult.error)
  logQueryError("change state count", stateCountResult.error)
  logQueryError("observed source changes", observedChangesResult.error)
  logQueryError("strategic changes", strategicChangesResult.error)

  const patentFilingLag = dateLagDays(patentLatest, now)
  const trademarkFilingLag = dateLagDays(trademarkLatest, now)
  const patentSyncAge = timestampLagDays(patentSync, now)
  const trademarkSyncAge = timestampLagDays(trademarkSync, now)

  const recentActivity: RecentCorpusActivity[] = [
    ...((patentsResult.data ?? []) as PatentActivityRow[])
      .filter((item): item is PatentActivityRow & { filing_date: string } => Boolean(item.filing_date))
      .map(item => ({
        id: `patent:${item.id}`,
        kind: "patent" as const,
        title: cleanText(item.title) || "Solicitud de patente",
        actor: cleanText(item.applicants),
        filing_date: item.filing_date,
        source_url: cleanText(item.source_url),
      })),
    ...((trademarksResult.data ?? []) as TrademarkActivityRow[])
      .filter((item): item is TrademarkActivityRow & { fecha_presentacion: string } => Boolean(item.fecha_presentacion))
      .map(item => ({
        id: `trademark:${item.id}`,
        kind: "trademark" as const,
        title: cleanText(item.nombre) || "Solicitud de marca",
        actor: cleanText(item.solicitante),
        filing_date: item.fecha_presentacion,
        source_url: cleanText(item.source_url),
      })),
  ]
    .sort((a, b) => b.filing_date.localeCompare(a.filing_date))
    .slice(0, 6)

  const observedChanges: ObservedSourceChange[] = ((observedChangesResult.data ?? []) as SourceChangeRow[]).map(row => ({
    id: String(row.id),
    kind: row.entity_type === "trademark" ? "trademark" : "patent",
    change_type: String(row.event_type),
    title: cleanText(row.title) || (row.entity_type === "trademark" ? "Cambio en expediente marcario" : "Cambio en expediente de patente"),
    summary: cleanText(row.summary),
    source_url: cleanText(row.source_url),
    source_date: cleanText(row.source_date),
    observed_at: String(row.observed_at),
    materiality: row.materiality === "alta" || row.materiality === "media" ? row.materiality : "baja",
    changed_fields: Array.isArray(row.changed_fields) ? row.changed_fields.map(String) : [],
  }))

  const strategicRows = (strategicChangesResult.data ?? []) as StrategicChangeRow[]
  const evidenceByChange = await loadStrategicEvidence(admin, strategicRows.map(row => String(row.id)))
  const strategicChanges: StrategicChange[] = strategicRows.map(row => ({
    id: String(row.id),
    subject_name: String(row.subject_name),
    change_type: String(row.change_type),
    title: String(row.title),
    observed_fact: String(row.observed_fact),
    interpretation: String(row.interpretation),
    why_it_matters: String(row.why_it_matters),
    materiality: row.materiality === "alta" || row.materiality === "media" ? row.materiality : "baja",
    confidence: Number(row.confidence) || 0,
    event_count: Number(row.event_count) || 0,
    distinct_records: Number(row.distinct_records) || 0,
    patent_events: Number(row.patent_events) || 0,
    trademark_events: Number(row.trademark_events) || 0,
    classification_codes: Array.isArray(row.classification_codes) ? row.classification_codes.map(String) : [],
    period_start: String(row.period_start),
    period_end: String(row.period_end),
    first_observed_at: String(row.first_observed_at),
    last_observed_at: String(row.last_observed_at),
    evidence: evidenceByChange.get(String(row.id)) ?? [],
  }))

  const baselinesReady = baselineCountResult.count ?? 0
  const events7d = observedChangesResult.count ?? 0
  const strategicChanges7d = strategicChangesResult.count ?? 0

  return {
    generated_at: now.toISOString(),
    window_start: windowStart,
    window_end: windowEnd,
    coverage: {
      patents: {
        latest_filing_date: patentLatest,
        last_synced_at: patentSync,
        filing_lag_days: patentFilingLag,
        sync_age_days: patentSyncAge,
        synchronized_recently: patentSyncAge !== null && patentSyncAge <= 2,
        records_in_latest_30d: patentCountResult.count ?? 0,
      },
      trademarks: {
        latest_filing_date: trademarkLatest,
        last_synced_at: trademarkSync,
        filing_lag_days: trademarkFilingLag,
        sync_age_days: trademarkSyncAge,
        synchronized_recently: trademarkSyncAge !== null && trademarkSyncAge <= 2,
        records_in_latest_30d: trademarkCountResult.count ?? 0,
      },
    },
    change_detection: {
      ready: baselinesReady >= EXPECTED_CHANGE_BASELINES,
      baselines_ready: baselinesReady,
      baselines_expected: EXPECTED_CHANGE_BASELINES,
      states_total: stateCountResult.count ?? 0,
      events_7d: events7d,
      strategic_changes_7d: strategicChanges7d,
      last_observed_at: strategicChanges[0]?.last_observed_at ?? observedChanges[0]?.observed_at ?? null,
    },
    strategic_changes: strategicChanges,
    observed_changes: observedChanges,
    recent_activity: recentActivity,
  }
}

async function loadStrategicEvidence(admin: SupabaseClient, strategicChangeIds: string[]) {
  const result = new Map<string, StrategicChangeEvidencePreview[]>()
  if (!strategicChangeIds.length) return result

  const { data: links, error: linkError } = await admin
    .from("intelligence_strategic_change_evidence")
    .select("strategic_change_id,source_event_id,evidence_role")
    .in("strategic_change_id", strategicChangeIds)
  if (linkError) {
    logQueryError("strategic evidence links", linkError)
    return result
  }

  const linkRows = (links ?? []) as EvidenceLinkRow[]
  const eventIds = [...new Set(linkRows.map(row => String(row.source_event_id)))]
  if (!eventIds.length) return result

  const { data: sourceEvents, error: eventError } = await admin
    .from("intelligence_source_events")
    .select("id,entity_type,event_type,title,summary,source_url,source_date,observed_at")
    .in("id", eventIds)
  if (eventError) {
    logQueryError("strategic evidence events", eventError)
    return result
  }

  const eventById = new Map(((sourceEvents ?? []) as EvidenceEventRow[]).map(row => [String(row.id), row]))
  for (const link of linkRows) {
    const event = eventById.get(String(link.source_event_id))
    if (!event) continue
    const changeId = String(link.strategic_change_id)
    const current = result.get(changeId) ?? []
    current.push({
      id: String(event.id),
      kind: event.entity_type === "trademark" ? "trademark" : "patent",
      change_type: String(event.event_type),
      title: cleanText(event.title) || (event.entity_type === "trademark" ? "Evidencia marcaria" : "Evidencia de patente"),
      summary: cleanText(event.summary),
      source_url: cleanText(event.source_url),
      source_date: cleanText(event.source_date),
      observed_at: String(event.observed_at),
      role: String(link.evidence_role),
    })
    result.set(changeId, current)
  }

  for (const [changeId, evidence] of result) {
    result.set(changeId, evidence.sort((a, b) => b.observed_at.localeCompare(a.observed_at)).slice(0, 4))
  }
  return result
}

function dateLagDays(value: string | null, now: Date) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const observed = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return Math.max(0, Math.floor((today - observed) / 86_400_000))
}

function timestampLagDays(value: string | null, now: Date) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000))
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000)
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) return null
  const normalized = String(value).replace(/\s+/g, " ").trim()
  return normalized || null
}

function logQueryError(scope: string, error: unknown) {
  if (error) console.error(`[weekly-brief:${scope}]`, error)
}
