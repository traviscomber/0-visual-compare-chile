import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isChangeBaselineInitialized,
  markChangeBaselineCompleted,
  recordSourceBatchChanges,
  type SourceChangeRecord,
} from "@/lib/intelligence/source-change-recorder"

const CKAN_BASE = process.env.INAPI_OPEN_DATA_CKAN_BASE || "https://datos.gob.cl/api/3/action"
const DATASETS = ["solicitudes-de-patentes", "registros-de-patentes"] as const
const APPLICATIONS_DATASET = "solicitudes-de-patentes" as const
const CHANGE_SOURCE_KEY = "inapi_open_data"
const PAGE_SIZE = 1000
const UPSERT_BATCH_SIZE = 500
const HISTORY_START_YEAR = 2009
const HISTORY_END_YEAR = 2025

export interface PatentOpenDataSyncSummary {
  startedAt: string
  finishedAt: string
  year: number
  datasets: Array<{
    dataset: string
    resourceId: string
    resourceName: string | null
    fetched: number
    normalized: number
    upserted: number
    ipcLinks: number
    changeEvents: number
    changeBaseline: boolean
  }>
  totalFetched: number
  totalUpserted: number
  totalIpcLinks: number
  totalChangeEvents: number
}

export interface PatentHistoryBackfillSummary {
  startedAt: string
  finishedAt: string
  completedYearsBefore: number[]
  attemptedYears: number[]
  completedYearsAfter: number[]
  remainingYears: number[]
  years: PatentOpenDataSyncSummary[]
  complete: boolean
}

export async function syncCurrentYearPatentOpenData(year = new Date().getUTCFullYear()): Promise<PatentOpenDataSyncSummary> {
  return syncPatentOpenDataYear(year, [...DATASETS], true)
}

export async function syncPatentOpenDataYear(
  year: number,
  datasets: Array<(typeof DATASETS)[number]> = [...DATASETS],
  trackChanges = year === new Date().getUTCFullYear(),
): Promise<PatentOpenDataSyncSummary> {
  const startedAt = new Date().toISOString()
  const summaries: PatentOpenDataSyncSummary["datasets"] = []

  for (const dataset of datasets) summaries.push(await syncDataset(dataset, year, trackChanges))

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    year,
    datasets: summaries,
    totalFetched: summaries.reduce((sum, item) => sum + item.fetched, 0),
    totalUpserted: summaries.reduce((sum, item) => sum + item.upserted, 0),
    totalIpcLinks: summaries.reduce((sum, item) => sum + item.ipcLinks, 0),
    totalChangeEvents: summaries.reduce((sum, item) => sum + item.changeEvents, 0),
  }
}

/**
 * Incrementally fills the official INAPI applications history without making the daily cron unbounded.
 * Completed years are discovered from inapi_sync_runs, so the process is restart-safe and idempotent.
 * Historical backfill never emits change events: only current-year refreshes feed the change engine.
 */
export async function syncNextPatentHistoryBatch(maxYears = 2): Promise<PatentHistoryBackfillSummary> {
  const startedAt = new Date().toISOString()
  const admin = createAdminClient()
  const historyYears = Array.from(
    { length: HISTORY_END_YEAR - HISTORY_START_YEAR + 1 },
    (_, index) => HISTORY_START_YEAR + index,
  )

  const { data: completedRuns, error } = await admin
    .from("inapi_sync_runs")
    .select("query")
    .eq("source", "inapi-patent-open-data")
    .eq("status", "completed")
    .eq("search_type", "patent_open_data")
    .like("query", `${APPLICATIONS_DATASET}:%`)

  if (error) throw new Error(`Could not inspect patent history coverage: ${error.message}`)

  const completedBefore = new Set<number>()
  for (const row of completedRuns || []) {
    const match = String(row.query || "").match(/solicitudes-de-patentes:(\d{4})$/)
    if (match) completedBefore.add(Number(match[1]))
  }

  const pending = historyYears.filter((year) => !completedBefore.has(year))
  const attemptedYears = pending.slice(0, Math.max(0, Math.min(maxYears, 4)))
  const summaries: PatentOpenDataSyncSummary[] = []

  for (const year of attemptedYears) {
    try {
      summaries.push(await syncPatentOpenDataYear(year, [APPLICATIONS_DATASET], false))
      completedBefore.add(year)
    } catch (error) {
      console.error(`[patent-history] ${year} failed`, error)
      break
    }
  }

  const completedYearsAfter = historyYears.filter((year) => completedBefore.has(year))
  const remainingYears = historyYears.filter((year) => !completedBefore.has(year))

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    completedYearsBefore: historyYears.filter((year) => !pending.includes(year)),
    attemptedYears,
    completedYearsAfter,
    remainingYears,
    years: summaries,
    complete: remainingYears.length === 0,
  }
}

async function syncDataset(dataset: (typeof DATASETS)[number], year: number, trackChanges: boolean) {
  const admin = createAdminClient()
  const packageInfo = await ckan("package_show", { id: dataset })
  const resource = chooseYearResource(packageInfo.resources || [], year)
  if (!resource?.id) throw new Error(`No DataStore resource found for ${dataset} ${year}`)

  const { data: run, error: runError } = await admin
    .from("inapi_sync_runs")
    .insert({
      source: "inapi-patent-open-data",
      status: "running",
      search_type: "patent_open_data",
      query: `${dataset}:${year}`,
      metadata: { dataset, year, resource_id: resource.id, resource_name: resource.name ?? null, trigger: "vercel-cron", track_changes: trackChanges },
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (runError || !run?.id) throw new Error(`Could not create patent sync run: ${runError?.message || "unknown"}`)

  const baselineInitialized = trackChanges
    ? await isChangeBaselineInitialized(admin, CHANGE_SOURCE_KEY, "patent", dataset)
    : true
  const baselineMode = trackChanges && !baselineInitialized

  let offset = 0
  let fetched = 0
  let normalized = 0
  let upserted = 0
  let ipcLinks = 0
  let changeEvents = 0
  let total = 0

  try {
    while (true) {
      const page = await ckan("datastore_search", { resource_id: String(resource.id), limit: PAGE_SIZE, offset })
      total = Number(page.total || total || 0)
      const records: Record<string, unknown>[] = Array.isArray(page.records) ? page.records : []
      if (!records.length) break

      fetched += records.length
      const rows = records.map((record: Record<string, unknown>) => normalizePatentRow(record, dataset)).filter(Boolean) as NormalizedPatentRow[]
      normalized += rows.length

      for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
        const batch = rows.slice(index, index + UPSERT_BATCH_SIZE)
        const result = await upsertBatch(admin, batch)
        upserted += result.upserted
        ipcLinks += result.ipcLinks

        if (trackChanges) {
          const changes = await recordSourceBatchChanges(admin, {
            sourceKey: CHANGE_SOURCE_KEY,
            entityType: "patent",
            dataset,
            syncRunId: String(run.id),
            baselineMode,
            records: batch.map(toPatentChangeRecord),
          })
          changeEvents += changes.changes
        }
      }

      offset += records.length
      await admin.from("inapi_sync_runs").update({
        total_fetched: total,
        inserted_count: upserted,
        updated_count: changeEvents,
        metadata: {
          dataset, year, resource_id: resource.id, resource_name: resource.name ?? null, trigger: "vercel-cron", track_changes: trackChanges,
          progress: { offset, fetched, normalized, upserted, ipcLinks, changeEvents, changeBaseline: baselineMode, total, lastActivityAt: new Date().toISOString() },
        },
      }).eq("id", run.id)

      if (records.length < PAGE_SIZE || offset >= total) break
    }

    if (trackChanges) {
      await markChangeBaselineCompleted(admin, CHANGE_SOURCE_KEY, "patent", dataset, String(run.id))
    }

    await admin.from("inapi_sync_runs").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      total_fetched: fetched,
      inserted_count: upserted,
      updated_count: changeEvents,
      error_message: null,
    }).eq("id", run.id)

    return {
      dataset,
      resourceId: String(resource.id),
      resourceName: resource.name ? String(resource.name) : null,
      fetched,
      normalized,
      upserted,
      ipcLinks,
      changeEvents,
      changeBaseline: baselineMode,
    }
  } catch (error) {
    await admin.from("inapi_sync_runs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : String(error),
    }).eq("id", run.id)
    throw error
  }
}

async function upsertBatch(admin: ReturnType<typeof createAdminClient>, rows: NormalizedPatentRow[]) {
  const payload = rows.map(({ ipc: _ipc, ...row }) => row)
  const { data, error } = await admin
    .from("patent_records")
    .upsert(payload, { onConflict: "source,source_record_id" })
    .select("id,source_record_id")

  if (error) throw new Error(`INAPI patent open-data upsert failed: ${error.message}`)

  const idBySource = new Map((data || []).map((row) => [String(row.source_record_id), String(row.id)]))
  const links: Array<{ patent_record_id: string; code: string }> = []
  for (const row of rows) {
    const recordId = idBySource.get(row.source_record_id)
    if (!recordId) continue
    for (const code of row.ipc) links.push({ patent_record_id: recordId, code })
  }

  if (links.length) {
    const { error: linkError } = await admin
      .from("patent_record_ipc")
      .upsert(links, { onConflict: "patent_record_id,code", ignoreDuplicates: true })
    if (linkError) throw new Error(`INAPI patent IPC upsert failed: ${linkError.message}`)
  }

  return { upserted: data?.length ?? 0, ipcLinks: links.length }
}

function toPatentChangeRecord(row: NormalizedPatentRow): SourceChangeRecord {
  return {
    sourceRecordId: row.source_record_id,
    title: row.title,
    searchText: [row.title, row.applicants, row.inventors, row.application_number, row.registration_number, row.status, row.country, ...row.ipc].filter(Boolean).join(" "),
    sourceUrl: row.source_url,
    sourceDate: row.registration_date || row.publication_date || row.filing_date,
    sourceUpdatedAt: metadataText(row.metadata, "lastUpdatedDate"),
    snapshot: {
      title: row.title,
      applicant: row.applicants,
      inventors: row.inventors,
      registration_number: row.registration_number,
      status: row.status,
      filing_date: row.filing_date,
      publication_date: row.publication_date,
      registration_date: row.registration_date,
      country: row.country,
      classification: [...row.ipc].sort(),
    },
  }
}

async function ckan(action: string, params: Record<string, string | number>) {
  const url = new URL(`${CKAN_BASE}/${action}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "VisualCompare-Patent-Intelligence/1.0" },
  })
  if (!response.ok) throw new Error(`CKAN ${action} HTTP ${response.status}`)
  const payload = await response.json()
  if (!payload?.success) throw new Error(`CKAN ${action} returned success=false`)
  return payload.result
}

function chooseYearResource(resources: Array<Record<string, unknown>>, year: number) {
  const yearText = String(year)
  const candidates = resources.filter((resource) => resource.datastore_active)

  return candidates.find((resource) => String(resource.name || "").includes(yearText))
    || candidates.find((resource) => String(resource.description || "").includes(yearText))
    || candidates.find((resource) => String(resource.url || "").includes(yearText))
    || null
}

type NormalizedPatentRow = {
  source: "inapi"
  source_record_id: string
  application_number: string
  registration_number: string | null
  title: string
  applicants: string | null
  representatives: string | null
  inventors: string | null
  filing_date: string | null
  publication_date: string | null
  registration_date: string | null
  expiration_date: string | null
  type_name: string | null
  subtype_name: string | null
  status: string | null
  country: string | null
  applicant_location: string | null
  applicant_region: string | null
  representative_location: string | null
  representative_region: string | null
  pct_application_date: string | null
  pct_publication_date: string | null
  priorities: string | null
  source_url: string
  metadata: Record<string, unknown>
  last_synced_at: string
  updated_at: string
  ipc: string[]
}

function normalizePatentRow(raw: Record<string, unknown>, dataset: string): NormalizedPatentRow | null {
  const applicationNumber = text(raw.ApplicationNumber)
  const title = text(raw.Title)
  if (!applicationNumber || !title) return null
  const now = new Date().toISOString()

  return {
    source: "inapi",
    source_record_id: `sol:${applicationNumber}`,
    application_number: applicationNumber,
    registration_number: text(raw.RegistrationNumber),
    title,
    applicants: text(raw.Applicants),
    representatives: text(raw.Representatives),
    inventors: text(raw.Inventors),
    filing_date: normalizeDate(raw.FilingDate),
    publication_date: normalizeDate(raw.PublicationDate),
    registration_date: normalizeDate(raw.RegistrationDate),
    expiration_date: normalizeDate(raw.ExpirationDate),
    type_name: text(raw.TypeName),
    subtype_name: text(raw.SubtypeName),
    status: text(raw.Status),
    country: text(raw.Country),
    applicant_location: text(raw.LocationApplicants),
    applicant_region: text(raw.ApplicantRegion),
    representative_location: text(raw.LocationRepresentatives),
    representative_region: text(raw.RepresentativeRegion),
    pct_application_date: normalizeDate(raw.PCTApplicationDate),
    pct_publication_date: normalizeDate(raw.PCTPublicationDate),
    priorities: text(raw.Priorities),
    source_url: `https://datos.gob.cl/dataset/${dataset}`,
    metadata: { openData: true, dataset, lastUpdatedDate: text(raw.LastUpdatedDate) },
    last_synced_at: now,
    updated_at: now,
    ipc: parseIpc(raw.IPC),
  }
}

function parseIpc(value: unknown) {
  const raw = text(value)
  if (!raw) return []
  return [...new Set(raw.split(";").map((code) => code.trim().toUpperCase()).filter(Boolean))]
}

function text(value: unknown) {
  if (value === null || value === undefined) return null
  const result = String(value).trim()
  return result || null
}

function metadataText(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key]
  return value === null || value === undefined ? null : String(value)
}

function normalizeDate(value: unknown) {
  const raw = text(value)
  if (!raw) return null
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null
}
