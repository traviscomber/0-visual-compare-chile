import { createAdminClient } from "@/lib/supabase/admin"

interface RecentRecordRow {
  id: string
  nombre: string
  numero_registro: string | null
  numero_solicitud: string | null
  estado: string | null
  updated_at: string
  metadata: Record<string, unknown> | null
  trademark_record_niza?: Array<{ code: string }>
  trademark_record_viena?: Array<{ code: string }>
}

interface RecentRunRow {
  id: string
  status: string
  search_type: string
  query: string
  total_fetched: number
  inserted_count: number
  updated_count: number
  created_at: string
  finished_at: string | null
}

export interface InapiInspectionPayload {
  summary: {
    totalRecords: number
    totalNizaAssignments: number
    totalVienaAssignments: number
    totalRuns: number
    completedRuns: number
    failedRuns: number
    sampleWithoutViena: number
  }
  recentRecords: Array<{
    id: string
    nombre: string
    numeroRegistro: string
    numeroSolicitud: string
    estado: string
    updatedAt: string
    nizaCodes: string[]
    vienaCodes: string[]
    fileSeq: string
    fileType: string
  }>
  recentRuns: Array<{
    id: string
    status: string
    searchType: string
    query: string
    totalFetched: number
    insertedCount: number
    updatedCount: number
    createdAt: string
    finishedAt: string | null
  }>
  actions: {
    vienaBackfillCommand: string
  }
}

export async function getInapiInspectionPayload(): Promise<InapiInspectionPayload> {
  const admin = createAdminClient()
  const [recordsCount, nizaCount, vienaCount, runsCount, completedRunsCount, failedRunsCount, recentRecordsResponse, recentRunsResponse] = await Promise.all([
    admin.from("trademark_records").select("id", { count: "exact", head: true }).eq("source", "inapi"),
    admin.from("trademark_record_niza").select("trademark_record_id", { count: "exact", head: true }),
    admin.from("trademark_record_viena").select("trademark_record_id", { count: "exact", head: true }),
    admin.from("inapi_sync_runs").select("id", { count: "exact", head: true }),
    admin.from("inapi_sync_runs").select("id", { count: "exact", head: true }).eq("status", "completed"),
    admin.from("inapi_sync_runs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    admin
      .from("trademark_records")
      .select("id, nombre, numero_registro, numero_solicitud, estado, updated_at, metadata, trademark_record_niza(code), trademark_record_viena(code)")
      .eq("source", "inapi")
      .order("updated_at", { ascending: false })
      .limit(15),
    admin
      .from("inapi_sync_runs")
      .select("id, status, search_type, query, total_fetched, inserted_count, updated_count, created_at, finished_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  if (recentRecordsResponse.error) {
    throw recentRecordsResponse.error
  }

  if (recentRunsResponse.error) {
    throw recentRunsResponse.error
  }

  const recentRecords = (recentRecordsResponse.data ?? []).map((row) => mapRecentRecord(row as unknown as RecentRecordRow))
  const sampleWithoutViena = recentRecords.filter((record) => record.vienaCodes.length === 0).length

  return {
    summary: {
      totalRecords: recordsCount.count ?? 0,
      totalNizaAssignments: nizaCount.count ?? 0,
      totalVienaAssignments: vienaCount.count ?? 0,
      totalRuns: runsCount.count ?? 0,
      completedRuns: completedRunsCount.count ?? 0,
      failedRuns: failedRunsCount.count ?? 0,
      sampleWithoutViena,
    },
    recentRecords,
    recentRuns: (recentRunsResponse.data ?? []).map((row) => ({
      id: row.id,
      status: row.status,
      searchType: row.search_type,
      query: row.query,
      totalFetched: row.total_fetched,
      insertedCount: row.inserted_count,
      updatedCount: row.updated_count,
      createdAt: row.created_at,
      finishedAt: row.finished_at,
    })),
    actions: {
      vienaBackfillCommand: "pnpm backfill:viena -- --limit 25 --delayMs 2500 --write",
    },
  }
}

function mapRecentRecord(row: RecentRecordRow) {
  const metadata = row.metadata ?? {}
  return {
    id: row.id,
    nombre: row.nombre,
    numeroRegistro: row.numero_registro ?? "",
    numeroSolicitud:
      typeof metadata.numSolicitud === "string" && metadata.numSolicitud.trim()
        ? metadata.numSolicitud.trim()
        : row.numero_solicitud ?? "",
    estado: row.estado ?? "Pendiente",
    updatedAt: row.updated_at,
    nizaCodes: (row.trademark_record_niza ?? []).map((item) => item.code),
    vienaCodes: (row.trademark_record_viena ?? []).map((item) => item.code),
    fileSeq: typeof metadata.fileSeq === "string" ? metadata.fileSeq : "",
    fileType: typeof metadata.fileType === "string" ? metadata.fileType : "",
  }
}
