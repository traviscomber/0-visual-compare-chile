import { createAdminClient } from "@/lib/supabase/admin"

export interface InapiLocalSearchHit {
  id: string
  nombre: string
  solicitante: string | null
  numeroRegistro: string | null
  numeroSolicitud: string | null
  estado: string | null
  fechaPresentacion: string | null
  fechaRegistro: string | null
  niza: string[]
  sourceRecordId: string | null
  sourceUrl: string | null
  lastSyncedAt: string | null
  nameSimilarity: number
  exactName: boolean
  classOverlap: number
  relevanceScore: number
}

export interface InapiLocalSearchResult {
  hits: InapiLocalSearchHit[]
  freshness: {
    latestSyncAt: string | null
    ageHours: number | null
    status: "fresh" | "aging" | "stale" | "unknown"
  }
}

export async function searchInapiLocal(query: string, nizaCodes: string[] = [], limit = 20): Promise<InapiLocalSearchResult> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("search_inapi_local", {
    p_query: query,
    p_niza_codes: nizaCodes,
    p_limit: Math.max(1, Math.min(limit, 50)),
  })

  if (error) throw new Error(`INAPI local search failed: ${error.message}`)

  const rows = Array.isArray(data) ? data : []
  const hits = rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    nombre: String(row.nombre ?? ""),
    solicitante: nullableString(row.solicitante),
    numeroRegistro: nullableString(row.numero_registro),
    numeroSolicitud: nullableString(row.numero_solicitud),
    estado: nullableString(row.estado),
    fechaPresentacion: nullableString(row.fecha_presentacion),
    fechaRegistro: nullableString(row.fecha_registro),
    niza: Array.isArray(row.niza_codes) ? row.niza_codes.map(String) : [],
    sourceRecordId: nullableString(row.source_record_id),
    sourceUrl: nullableString(row.source_url),
    lastSyncedAt: nullableString(row.last_synced_at),
    nameSimilarity: Number(row.name_similarity ?? 0),
    exactName: Boolean(row.exact_name),
    classOverlap: Number(row.class_overlap ?? 0),
    relevanceScore: Number(row.relevance_score ?? 0),
  }))

  const latestSyncAt = hits.reduce<string | null>((latest, hit) => {
    if (!hit.lastSyncedAt) return latest
    if (!latest || new Date(hit.lastSyncedAt).getTime() > new Date(latest).getTime()) return hit.lastSyncedAt
    return latest
  }, null)

  return { hits, freshness: describeFreshness(latestSyncAt) }
}

export function shouldVerifyInapiLive(result: InapiLocalSearchResult) {
  const top = result.hits[0]
  if (!top) return true
  if (result.freshness.status === "stale" || result.freshness.status === "unknown") return true
  if (top.exactName && top.classOverlap > 0) return true
  if (top.nameSimilarity >= 0.72 && top.classOverlap > 0) return true
  return false
}

function describeFreshness(latestSyncAt: string | null): InapiLocalSearchResult["freshness"] {
  if (!latestSyncAt) return { latestSyncAt: null, ageHours: null, status: "unknown" }
  const ageHours = Math.max(0, (Date.now() - new Date(latestSyncAt).getTime()) / 3_600_000)
  const status = ageHours <= 36 ? "fresh" : ageHours <= 168 ? "aging" : "stale"
  return { latestSyncAt, ageHours, status }
}

function nullableString(value: unknown) {
  return value == null || value === "" ? null : String(value)
}
