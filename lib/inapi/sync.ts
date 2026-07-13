import { createAdminClient } from "@/lib/supabase/admin"
import { searchInapi, type InapiMatchMode, type InapiSearchType } from "@/lib/inapi/client"
import { buildInapiPresetJobs, type InapiPresetKey, type InapiSyncJob } from "@/lib/inapi/presets"
import { clearTrademarkRecordsCache, toStoredTrademarkRecord } from "@/lib/trademark-records"

export interface InapiSyncInput {
  query: string
  searchType?: InapiSearchType
  matchMode?: InapiMatchMode
  initiatedBy?: string | null
  metadata?: Record<string, unknown>
}

export interface InapiSyncResult {
  runId: string
  inserted: number
  updated: number
  totalFetched: number
}

export interface InapiBatchSyncInput {
  jobs?: InapiSyncJob[]
  preset?: InapiPresetKey
  matchMode?: InapiMatchMode
  initiatedBy?: string | null
  delayMs?: number
  startIndex?: number
  maxJobs?: number
}

export interface InapiBatchSyncResult {
  totalAvailableJobs: number
  totalRuns: number
  startIndex: number
  endIndex: number
  totalFetched: number
  totalInserted: number
  totalUpdated: number
  runs: InapiSyncResult[]
}

export async function runInapiSync({
  query,
  searchType = "nombre",
  matchMode = "2",
  initiatedBy = null,
  metadata = {},
}: InapiSyncInput): Promise<InapiSyncResult> {
  const admin = createAdminClient()
  const startedAt = new Date().toISOString()

  const { data: run, error: runError } = await admin
    .from("inapi_sync_runs")
    .insert({
      source: "inapi",
      status: "running",
      search_type: searchType,
      query,
      initiated_by: initiatedBy,
      metadata,
      started_at: startedAt,
    })
    .select("id")
    .single()

  if (runError || !run) {
    throw new Error(`Failed to create sync run: ${runError?.message ?? "unknown error"}`)
  }

  try {
    const marcas = await searchInapi({
      query,
      type: searchType,
      matchMode,
    })

    let inserted = 0
    let updated = 0

    for (const marca of marcas) {
      const stored = toStoredTrademarkRecord(marca)

      const { data: existing } = await admin
        .from("trademark_records")
        .select("id")
        .eq("source", stored.source)
        .eq("source_record_id", stored.source_record_id)
        .maybeSingle()

      const payload = {
        source: stored.source,
        source_record_id: stored.source_record_id,
        nombre: stored.nombre,
        solicitante: stored.solicitante,
        numero_registro: stored.numero_registro,
        numero_solicitud: stored.numero_solicitud,
        estado: stored.estado,
        fecha_presentacion: stored.fecha_presentacion,
        fecha_registro: stored.fecha_registro,
        fecha_resolucion: stored.fecha_resolucion,
        pais: stored.pais,
        source_url: stored.source_url,
        metadata: stored.metadata,
        last_synced_at: new Date().toISOString(),
      }

      const { data: record, error: upsertError } = await admin
        .from("trademark_records")
        .upsert(payload, {
          onConflict: "source,source_record_id",
        })
        .select("id")
        .single()

      if (upsertError || !record) {
        throw new Error(`Failed to upsert trademark record: ${upsertError?.message ?? "unknown error"}`)
      }

      await admin.from("trademark_record_niza").delete().eq("trademark_record_id", record.id)
      await admin.from("trademark_record_viena").delete().eq("trademark_record_id", record.id)

      if (stored.niza.length) {
        const { error } = await admin.from("trademark_record_niza").insert(
          stored.niza.map((code) => ({
            trademark_record_id: record.id,
            code,
          })),
        )

        if (error) {
          throw new Error(`Failed to persist Niza codes: ${error.message}`)
        }
      }

      if (stored.viena.length) {
        const { error } = await admin.from("trademark_record_viena").insert(
          stored.viena.map((code) => ({
            trademark_record_id: record.id,
            code,
          })),
        )

        if (error) {
          throw new Error(`Failed to persist Viena codes: ${error.message}`)
        }
      }

      if (existing?.id) {
        updated += 1
      } else {
        inserted += 1
      }
    }

    await admin
      .from("inapi_sync_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        total_fetched: marcas.length,
        inserted_count: inserted,
        updated_count: updated,
        error_message: null,
      })
      .eq("id", run.id)

    clearTrademarkRecordsCache()

    return {
      runId: run.id,
      inserted,
      updated,
      totalFetched: marcas.length,
    }
  } catch (error) {
    await admin
      .from("inapi_sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: String(error),
      })
      .eq("id", run.id)

    throw error
  }
}

export async function runInapiSyncBatch({
  jobs,
  preset,
  matchMode = "2",
  initiatedBy = null,
  delayMs = 400,
  startIndex = 0,
  maxJobs,
}: InapiBatchSyncInput): Promise<InapiBatchSyncResult> {
  const resolvedJobs = jobs?.length ? jobs : preset ? buildInapiPresetJobs(preset) : []

  if (!resolvedJobs.length) {
    throw new Error("Batch sync requires at least one job or a preset")
  }

  const normalizedStartIndex = Number.isFinite(startIndex) ? Math.max(0, Math.floor(startIndex)) : 0
  const normalizedMaxJobs =
    typeof maxJobs === "number" && Number.isFinite(maxJobs) ? Math.max(1, Math.floor(maxJobs)) : null
  const slicedJobs = normalizedMaxJobs
    ? resolvedJobs.slice(normalizedStartIndex, normalizedStartIndex + normalizedMaxJobs)
    : resolvedJobs.slice(normalizedStartIndex)

  if (!slicedJobs.length) {
    throw new Error("Batch sync window resolved to zero jobs")
  }

  const results: InapiSyncResult[] = []

  for (let index = 0; index < slicedJobs.length; index += 1) {
    const job = slicedJobs[index]
    const absolutePosition = normalizedStartIndex + index + 1
    const result = await runInapiSync({
      query: job.query,
      searchType: job.searchType,
      matchMode,
      initiatedBy,
      metadata: {
        batch: true,
        preset: preset ?? null,
        position: absolutePosition,
        total_jobs: resolvedJobs.length,
        batch_start_index: normalizedStartIndex,
        batch_window_size: slicedJobs.length,
      },
    })

    results.push(result)

    if (delayMs > 0 && index < slicedJobs.length - 1) {
      await sleep(delayMs)
    }
  }

  return {
    totalAvailableJobs: resolvedJobs.length,
    totalRuns: results.length,
    startIndex: normalizedStartIndex,
    endIndex: normalizedStartIndex + slicedJobs.length - 1,
    totalFetched: results.reduce((sum, item) => sum + item.totalFetched, 0),
    totalInserted: results.reduce((sum, item) => sum + item.inserted, 0),
    totalUpdated: results.reduce((sum, item) => sum + item.updated, 0),
    runs: results,
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
