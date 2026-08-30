import type { SupabaseClient } from "@supabase/supabase-js"

export type IntelligenceCoverage = {
  latest_filing_date: string | null
  last_synced_at: string | null
  lag_days: number | null
  fresh_for_week: boolean
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

export type WeeklyBriefContext = {
  generated_at: string
  window_start: string
  window_end: string
  coverage: {
    patents: IntelligenceCoverage
    trademarks: IntelligenceCoverage
  }
  recent_activity: RecentCorpusActivity[]
}

type LatestPatentRow = { filing_date: string | null }
type LatestTrademarkRow = { fecha_presentacion: string | null }
type LatestSyncRow = { last_synced_at: string | null }
type PatentActivityRow = { id: string; title: string | null; applicants: string | null; filing_date: string | null; source_url: string | null }
type TrademarkActivityRow = { id: string; nombre: string | null; solicitante: string | null; fecha_presentacion: string | null; source_url: string | null }

export async function buildWeeklyBriefContext(admin: SupabaseClient): Promise<WeeklyBriefContext> {
  const now = new Date()
  const windowEnd = isoDate(now)
  const windowStart = isoDate(addDays(now, -6))

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

  const [patentCountResult, trademarkCountResult, patentsResult, trademarksResult] = await Promise.all([
    patentLatest && patentPeriodStart
      ? admin.from("patent_records").select("id", { count: "exact", head: true }).gte("filing_date", patentPeriodStart).lte("filing_date", patentLatest)
      : Promise.resolve({ count: 0, error: null }),
    trademarkLatest && trademarkPeriodStart
      ? admin.from("trademark_records").select("id", { count: "exact", head: true }).gte("fecha_presentacion", trademarkPeriodStart).lte("fecha_presentacion", trademarkLatest)
      : Promise.resolve({ count: 0, error: null }),
    admin.from("patent_records").select("id,title,applicants,filing_date,source_url").not("filing_date", "is", null).order("filing_date", { ascending: false }).limit(3),
    admin.from("trademark_records").select("id,nombre,solicitante,fecha_presentacion,source_url").not("fecha_presentacion", "is", null).order("fecha_presentacion", { ascending: false }).limit(3),
  ])

  logQueryError("patent latest-period count", patentCountResult.error)
  logQueryError("trademark latest-period count", trademarkCountResult.error)
  logQueryError("patent recent activity", patentsResult.error)
  logQueryError("trademark recent activity", trademarksResult.error)

  const patentLag = lagDays(patentLatest, now)
  const trademarkLag = lagDays(trademarkLatest, now)

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

  return {
    generated_at: now.toISOString(),
    window_start: windowStart,
    window_end: windowEnd,
    coverage: {
      patents: {
        latest_filing_date: patentLatest,
        last_synced_at: patentSync,
        lag_days: patentLag,
        fresh_for_week: patentLag !== null && patentLag <= 7,
        records_in_latest_30d: patentCountResult.count ?? 0,
      },
      trademarks: {
        latest_filing_date: trademarkLatest,
        last_synced_at: trademarkSync,
        lag_days: trademarkLag,
        fresh_for_week: trademarkLag !== null && trademarkLag <= 7,
        records_in_latest_30d: trademarkCountResult.count ?? 0,
      },
    },
    recent_activity: recentActivity,
  }
}

function lagDays(value: string | null, now: Date) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const observed = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return Math.max(0, Math.floor((today - observed) / 86_400_000))
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000)
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.replace(/\s+/g, " ").trim()
  return normalized || null
}

function logQueryError(scope: string, error: unknown) {
  if (error) console.error(`[weekly-brief:${scope}]`, error)
}
