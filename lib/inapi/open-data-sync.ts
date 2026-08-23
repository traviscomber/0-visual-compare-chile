import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

const CKAN_BASE = process.env.INAPI_OPEN_DATA_CKAN_BASE || "https://datos.gob.cl/api/3/action"
const DATASETS = ["solicitudes-de-marcas", "registros-de-marcas"] as const
const PAGE_SIZE = 1000
const UPSERT_BATCH_SIZE = 500

export interface OpenDataSyncSummary {
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
    nizaLinks: number
  }>
  totalFetched: number
  totalUpserted: number
  totalNizaLinks: number
}

export async function syncCurrentYearInapiOpenData(year = new Date().getUTCFullYear()): Promise<OpenDataSyncSummary> {
  const startedAt = new Date().toISOString()
  const datasets: OpenDataSyncSummary["datasets"] = []
  for (const dataset of DATASETS) datasets.push(await syncDataset(dataset, year))
  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    year,
    datasets,
    totalFetched: datasets.reduce((sum, item) => sum + item.fetched, 0),
    totalUpserted: datasets.reduce((sum, item) => sum + item.upserted, 0),
    totalNizaLinks: datasets.reduce((sum, item) => sum + item.nizaLinks, 0),
  }
}

async function syncDataset(dataset: (typeof DATASETS)[number], year: number) {
  const admin = createAdminClient()
  const packageInfo = await ckan("package_show", { id: dataset })
  const resource = chooseCurrentYearResource(packageInfo.resources || [], year)
  if (!resource?.id) throw new Error(`No DataStore resource found for ${dataset} ${year}`)

  const { data: run, error: runError } = await admin.from("inapi_sync_runs").insert({
    source: "inapi-open-data",
    status: "running",
    search_type: "open_data",
    query: `${dataset}:${year}`,
    metadata: { dataset, year, resource_id: resource.id, resource_name: resource.name ?? null, trigger: "vercel-cron" },
    started_at: new Date().toISOString(),
  }).select("id").single()
  if (runError || !run?.id) throw new Error(`Could not create sync run: ${runError?.message || "unknown"}`)

  let offset = 0
  let fetched = 0
  let normalized = 0
  let upserted = 0
  let nizaLinks = 0
  let total = 0

  try {
    while (true) {
      const page = await ckan("datastore_search", { resource_id: String(resource.id), limit: PAGE_SIZE, offset })
      total = Number(page.total || total || 0)
      const records: Record<string, unknown>[] = Array.isArray(page.records) ? page.records : []
      if (!records.length) break

      fetched += records.length
      const rows = records.map((record: Record<string, unknown>) => normalizeOpenDataRow(record, dataset)).filter(Boolean) as NormalizedRow[]
      normalized += rows.length

      for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
        const result = await upsertBatch(admin, rows.slice(index, index + UPSERT_BATCH_SIZE))
        upserted += result.upserted
        nizaLinks += result.nizaLinks
      }

      offset += records.length
      const { error: progressError } = await admin.from("inapi_sync_runs").update({
        total_fetched: total,
        inserted_count: upserted,
        updated_count: 0,
        metadata: { dataset, year, resource_id: resource.id, resource_name: resource.name ?? null, trigger: "vercel-cron", progress: { offset, fetched, normalized, upserted, nizaLinks, total, lastActivityAt: new Date().toISOString() } },
      }).eq("id", run.id)
      if (progressError) console.error("[inapi-open-data] progress update failed", progressError.message)
      if (records.length < PAGE_SIZE || offset >= total) break
    }

    const { error: completeError } = await admin.from("inapi_sync_runs").update({ status: "completed", finished_at: new Date().toISOString(), total_fetched: fetched, inserted_count: upserted, updated_count: 0, error_message: null }).eq("id", run.id)
    if (completeError) console.error("[inapi-open-data] completion update failed", completeError.message)
    return { dataset, resourceId: String(resource.id), resourceName: resource.name ? String(resource.name) : null, fetched, normalized, upserted, nizaLinks }
  } catch (error) {
    await admin.from("inapi_sync_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : String(error) }).eq("id", run.id)
    throw error
  }
}

async function upsertBatch(admin: ReturnType<typeof createAdminClient>, rows: NormalizedRow[]) {
  // CKAN occasionally returns duplicate ApplicationNumber rows inside the same page.
  // Postgres cannot update the same ON CONFLICT target twice in one statement, so
  // collapse duplicates deterministically and preserve the union of Niza classes.
  const dedupedBySource = new Map<string, NormalizedRow>()
  for (const row of rows) {
    const previous = dedupedBySource.get(row.source_record_id)
    dedupedBySource.set(row.source_record_id, previous ? { ...previous, ...row, niza: [...new Set([...previous.niza, ...row.niza])] } : row)
  }
  const dedupedRows = [...dedupedBySource.values()]
  const payload = dedupedRows.map(({ niza: _niza, ...row }) => row)
  const { data, error } = await admin.from("trademark_records").upsert(payload, { onConflict: "source,source_record_id" }).select("id,source_record_id")
  if (error) throw new Error(`INAPI open-data upsert failed: ${error.message}`)

  const idBySource = new Map((data || []).map((row) => [String(row.source_record_id), String(row.id)]))
  const links: Array<{ trademark_record_id: string; code: string }> = []
  for (const row of dedupedRows) {
    const recordId = idBySource.get(row.source_record_id)
    if (!recordId) continue
    for (const code of row.niza) links.push({ trademark_record_id: recordId, code })
  }
  if (links.length) {
    const { error: linkError } = await admin.from("trademark_record_niza").upsert(links, { onConflict: "trademark_record_id,code", ignoreDuplicates: true })
    if (linkError) throw new Error(`INAPI Niza upsert failed: ${linkError.message}`)
  }
  return { upserted: data?.length ?? 0, nizaLinks: links.length }
}

async function ckan(action: string, params: Record<string, string | number>) {
  const url = new URL(`${CKAN_BASE}/${action}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json", "User-Agent": "VisualCompare-INAPI-Cron/1.0" } })
  if (!response.ok) throw new Error(`CKAN ${action} HTTP ${response.status}`)
  const payload = await response.json()
  if (!payload?.success) throw new Error(`CKAN ${action} returned success=false`)
  return payload.result
}

function chooseCurrentYearResource(resources: Array<Record<string, unknown>>, year: number) {
  const yearText = String(year)
  return resources.find((resource) => resource.datastore_active && String(resource.name || "").includes(yearText)) || resources.find((resource) => resource.datastore_active && String(resource.description || "").includes(yearText)) || null
}

type NormalizedRow = {
  source: "inapi"; source_record_id: string; nombre: string; solicitante: string | null; numero_registro: string | null; numero_solicitud: string; estado: string | null; fecha_presentacion: string | null; fecha_registro: string | null; fecha_resolucion: null; pais: string; source_url: string; metadata: Record<string, unknown>; last_synced_at: string; niza: string[]
}

function normalizeOpenDataRow(raw: Record<string, unknown>, dataset: string): NormalizedRow | null {
  const applicationNumber = text(raw.ApplicationNumber)
  const brandName = text(raw.BrandName)
  if (!applicationNumber || !brandName) return null
  const registrationNumber = text(raw.RegistrationNumber)
  return {
    source: "inapi",
    source_record_id: `sol:${applicationNumber}`,
    nombre: brandName,
    solicitante: text(raw.Applicants),
    numero_registro: registrationNumber,
    numero_solicitud: applicationNumber,
    estado: normalizeStatus(raw.Status),
    fecha_presentacion: normalizeDate(raw.FilingDate),
    fecha_registro: normalizeDate(raw.RegistrationDate),
    fecha_resolucion: null,
    pais: "CL",
    source_url: `https://datos.gob.cl/dataset/${dataset}`,
    metadata: { openData: true, dataset, lastUpdatedDate: text(raw.LastUpdatedDate), signType: text(raw.SignType), typeName: text(raw.TypeName), subtypeName: text(raw.SubtypeName), viennaClasses: text(raw.VienaClasses), image: text(raw.IMAGE) },
    last_synced_at: new Date().toISOString(),
    niza: parseCodes(raw.NizaClasses),
  }
}

function text(value: unknown) { if (value === null || value === undefined) return null; const result = String(value).trim(); return result || null }
function parseCodes(value: unknown) { if (value === null || value === undefined) return []; return [...new Set(String(value).match(/\b(?:[1-9]|[1-3][0-9]|4[0-5])\b/g) || [])] }
function normalizeDate(value: unknown) { const raw = text(value); if (!raw) return null; return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null }
function normalizeStatus(value: unknown) {
  const raw = text(value); if (!raw) return null
  const status = raw.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  if (status.includes("registr") || status.includes("conced")) return "Registrada"
  if (status.includes("tramite") || status.includes("pend") || status.includes("solicit")) return "Pendiente"
  if (status.includes("deneg") || status.includes("rechaz") || status.includes("abandon")) return "Denegada"
  if (status.includes("caduc") || status.includes("cancel") || status.includes("venc") || status.includes("no vigente") || status.includes("desist")) return "No Vigente"
  return raw
}
