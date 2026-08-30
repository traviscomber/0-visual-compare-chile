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

export type ChangeDetectionStatus = {
  ready: boolean
  baselines_ready: number
  baselines_expected: number
  states_total: number
  events_7d: number
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

  const [patentCountResult, trademarkCountResult, patentsResult, trademarksResult, baselineCountResult, stateCountResult, observedChangesResult] = await Promise.all([
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
  ])

  logQueryError("patent latest-period count", patentCountResult.error)
  logQueryError("trademark latest-period count", trademarkCountResult.error)
  logQueryError("patent recent activity", patentsResult.error)
  logQueryError("trademark recent activity", trademarksResult.error)
  logQueryError("change baseline count", baselineCountResult.error)
  logQueryError("change state count", stateCountResult.error)
  logQueryError("observed source changes", observedChangesResult.error)

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

  const baselinesReady = baselineCountResult.count ?? 0
  const events7d = observedChangesResult.count ?? 0

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
      last_observed_at: observedChanges[0]?.observed_at ?? null,
    },
    observed_changes: observedChanges,
    recent_activity: recentActivity,
  }
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
