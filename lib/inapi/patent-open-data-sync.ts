import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

const CKAN_BASE = process.env.INAPI_OPEN_DATA_CKAN_BASE || "https://datos.gob.cl/api/3/action"
const DATASETS = ["solicitudes-de-patentes", "registros-de-patentes"] as const
const PAGE_SIZE = 1000
const UPSERT_BATCH_SIZE = 500

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
  }>
  totalFetched: number
  totalUpserted: number
  totalIpcLinks: number
}

export async function syncCurrentYearPatentOpenData(year = new Date().getUTCFullYear()): Promise<PatentOpenDataSyncSummary> {
  const startedAt = new Date().toISOString()
  const datasets: PatentOpenDataSyncSummary["datasets"] = []

  for (const dataset of DATASETS) datasets.push(await syncDataset(dataset, year))

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    year,
    datasets,
    totalFetched: datasets.reduce((sum, item) => sum + item.fetched, 0),
    totalUpserted: datasets.reduce((sum, item) => sum + item.upserted, 0),
    totalIpcLinks: datasets.reduce((sum, item) => sum + item.ipcLinks, 0),
  }
}

async function syncDataset(dataset: (typeof DATASETS)[number], year: number) {
  const admin = createAdminClient()
  const packageInfo = await ckan("package_show", { id: dataset })
  const resource = chooseCurrentYearResource(packageInfo.resources || [], year)
  if (!resource?.id) throw new Error(`No DataStore resource found for ${dataset} ${year}`)

  const { data: run, error: runError } = await admin
    .from("inapi_sync_runs")
    .insert({
      source: "inapi-patent-open-data",
      status: "running",
      search_type: "patent_open_data",
      query: `${dataset}:${year}`,
      metadata: { dataset, year, resource_id: resource.id, resource_name: resource.name ?? null, trigger: "vercel-cron" },
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (runError || !run?.id) throw new Error(`Could not create patent sync run: ${runError?.message || "unknown"}`)

  let offset = 0
  let fetched = 0
  let normalized = 0
  let upserted = 0
  let ipcLinks = 0
  let total = 0

  try {
    while (true) {
      const page = await ckan("datastore_search", { resource_id: resource.id, limit: PAGE_SIZE, offset })
      total = Number(page.total || total || 0)
      const records = Array.isArray(page.records) ? page.records : []
      if (!records.length) break

      fetched += records.length
      const rows = records.map((record) => normalizePatentRow(record, dataset)).filter(Boolean) as NormalizedPatentRow[]
      normalized += rows.length

      for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
        const result = await upsertBatch(admin, rows.slice(index, index + UPSERT_BATCH_SIZE))
        upserted += result.upserted
        ipcLinks += result.ipcLinks
      }

      offset += records.length
      await admin.from("inapi_sync_runs").update({
        total_fetched: total,
        inserted_count: upserted,
        updated_count: 0,
        metadata: {
          dataset, year, resource_id: resource.id, resource_name: resource.name ?? null, trigger: "vercel-cron",
          progress: { offset, fetched, normalized, upserted, ipcLinks, total, lastActivityAt: new Date().toISOString() },
        },
      }).eq("id", run.id)

      if (records.length < PAGE_SIZE || offset >= total) break
    }

    await admin.from("inapi_sync_runs").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      total_fetched: fetched,
      inserted_count: upserted,
      updated_count: 0,
      error_message: null,
    }).eq("id", run.id)

    return { dataset, resourceId: String(resource.id), resourceName: resource.name ? String(resource.name) : null, fetched, normalized, upserted, ipcLinks }
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

function chooseCurrentYearResource(resources: Array<Record<string, unknown>>, year: number) {
  const yearText = String(year)
  return resources.find((resource) => resource.datastore_active && String(resource.name || "").includes(yearText))
    || resources.find((resource) => resource.datastore_active && String(resource.description || "").includes(yearText))
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

function normalizeDate(value: unknown) {
  const raw = text(value)
  if (!raw) return null
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null
}
