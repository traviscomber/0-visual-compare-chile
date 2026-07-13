import { API_PORTAL_MARCAS, findMarcaById } from "@/lib/api-portal-data"
import { createAdminClient } from "@/lib/supabase/admin"
import { resetSearchEngine } from "@/lib/search-engine"
import type { Marca, SearchFilters, SearchResult } from "@/types/marca"

interface TrademarkRecordRow {
  id: string
  source: string
  source_record_id: string | null
  nombre: string
  solicitante: string | null
  numero_registro: string | null
  numero_solicitud: string | null
  estado: string | null
  fecha_presentacion: string | null
  fecha_registro: string | null
  fecha_resolucion: string | null
  pais: string | null
  source_url: string | null
  metadata: Record<string, unknown> | null
  trademark_record_niza?: Array<{ code: string }>
  trademark_record_viena?: Array<{ code: string }>
}

export interface SearchTrademarkRecordsOptions {
  query: string
  type: "nombre" | "niza" | "viena"
  filters: SearchFilters
  page: number
  limit: number
}

export interface SearchTrademarkRecordsResponse {
  results: SearchResult[]
  total: number
  page: number
  totalPages: number
  limit: number
  source: "supabase" | "seed"
}

export interface TrademarkStats {
  totalRecords: number
  source: "supabase" | "seed"
}

const FALLBACK_ENGINE = resetSearchEngine(API_PORTAL_MARCAS)
const TRADEMARK_SELECT =
  "id, source, source_record_id, nombre, solicitante, numero_registro, numero_solicitud, estado, fecha_presentacion, fecha_registro, fecha_resolucion, pais, source_url, metadata, trademark_record_niza(code), trademark_record_viena(code)"
const SUPABASE_BATCH_SIZE = 1000
const SUPABASE_CACHE_TTL_MS = 60_000

let cachedSupabaseRecords: Marca[] | null = null
let cachedSupabaseRecordsFetchedAt = 0
let supabaseRecordsPromise: Promise<Marca[]> | null = null

export async function searchTrademarkRecords({
  query,
  type,
  filters,
  page,
  limit,
}: SearchTrademarkRecordsOptions): Promise<SearchTrademarkRecordsResponse> {
  const supabaseRecords = await loadTrademarkRecordsFromSupabase()
  if (!supabaseRecords.length) {
    return searchFallbackRecords({ query, type, filters, page, limit })
  }

  const engine = resetSearchEngine(supabaseRecords)
  const allResults = query
    ? engine.search({ query, type, filters })
    : supabaseRecords.filter((marca) => matchesFilters(marca, filters)).map((marca) => ({
        marca,
        relevancia: 0,
        matchType: "partial" as const,
      }))

  const total = allResults.length
  const isPaginated = limit > 0
  const totalPages = isPaginated ? Math.max(1, Math.ceil(total / limit)) : 1
  const from = isPaginated ? (page - 1) * limit : 0
  const results = isPaginated ? allResults.slice(from, from + limit) : allResults

  return {
    results,
    total,
    page,
    totalPages,
    limit: isPaginated ? limit : total || 0,
    source: "supabase",
  }
}

export async function getTrademarkRecordById(id: string): Promise<{ result: Marca | null; source: "supabase" | "seed" }> {
  const record = await loadTrademarkRecordByIdFromSupabase(id)
  if (record) {
    return { result: record, source: "supabase" }
  }

  return {
    result: findMarcaById(id),
    source: "seed",
  }
}

export async function getTrademarkStats(): Promise<TrademarkStats> {
  const supabaseCount = await countTrademarkRecordsInSupabase()
  if (supabaseCount > 0) {
    return { totalRecords: supabaseCount, source: "supabase" }
  }

  return { totalRecords: API_PORTAL_MARCAS.length, source: "seed" }
}

export function clearTrademarkRecordsCache() {
  cachedSupabaseRecords = null
  cachedSupabaseRecordsFetchedAt = 0
  supabaseRecordsPromise = null
}

export function toStoredTrademarkRecord(marca: Marca) {
  return {
    source: "inapi",
    source_record_id: marca.id,
    nombre: marca.nombre,
    solicitante: marca.solicitante,
    numero_registro: marca.numeroRegistro || null,
    numero_solicitud:
      typeof marca.metadata?.numSolicitud === "string" && marca.metadata.numSolicitud.trim()
        ? marca.metadata.numSolicitud.trim()
        : null,
    estado: marca.estado,
    fecha_presentacion: marca.fecha || null,
    fecha_registro: marca.fecha || null,
    fecha_resolucion: null,
    pais: marca.pais || "CL",
    source_url:
      typeof marca.metadata?.fileSeq === "string" && marca.metadata.fileSeq
        ? `https://buscadormarcas.inapi.cl/Marca/BuscarMarca.aspx`
        : null,
    metadata: marca.metadata ?? {},
    niza: marca.niza,
    viena: marca.viena,
  }
}

async function loadTrademarkRecordsFromSupabase(): Promise<Marca[]> {
  const now = Date.now()
  if (cachedSupabaseRecords && now - cachedSupabaseRecordsFetchedAt < SUPABASE_CACHE_TTL_MS) {
    return cachedSupabaseRecords
  }

  if (supabaseRecordsPromise) {
    return supabaseRecordsPromise
  }

  supabaseRecordsPromise = loadTrademarkRecordsFromSupabaseUncached()

  try {
    const records = await supabaseRecordsPromise
    cachedSupabaseRecords = records
    cachedSupabaseRecordsFetchedAt = Date.now()
    return records
  } finally {
    supabaseRecordsPromise = null
  }
}

async function loadTrademarkRecordsFromSupabaseUncached(): Promise<Marca[]> {
  try {
    const admin = createAdminClient()
    const results: Marca[] = []
    let from = 0

    while (true) {
      const to = from + SUPABASE_BATCH_SIZE - 1
      const { data, error } = await admin
        .from("trademark_records")
        .select(TRADEMARK_SELECT)
        .order("updated_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error("[v0] load trademark records error", error)
        return []
      }

      const rows = (data ?? []).map((row) => mapRowToMarca(row as unknown as TrademarkRecordRow))
      results.push(...rows)

      if (rows.length < SUPABASE_BATCH_SIZE) {
        break
      }

      from += SUPABASE_BATCH_SIZE
    }

    return results
  } catch (error) {
    console.error("[v0] load trademark records exception", error)
    return []
  }
}

async function loadTrademarkRecordByIdFromSupabase(id: string): Promise<Marca | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("trademark_records")
      .select(TRADEMARK_SELECT)
      .eq("id", id)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return mapRowToMarca(data as unknown as TrademarkRecordRow)
  } catch (error) {
    console.error("[v0] load trademark record by id exception", error)
    return null
  }
}

async function countTrademarkRecordsInSupabase(): Promise<number> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin.from("trademark_records").select("id", { count: "exact", head: true })
    if (error) {
      console.error("[v0] count trademark records error", error)
      return 0
    }

    return count ?? 0
  } catch (error) {
    console.error("[v0] count trademark records exception", error)
    return 0
  }
}

function searchFallbackRecords({
  query,
  type,
  filters,
  page,
  limit,
}: SearchTrademarkRecordsOptions): SearchTrademarkRecordsResponse {
  const allResults = query
    ? FALLBACK_ENGINE.search({ query, type, filters })
    : API_PORTAL_MARCAS.filter((marca) => matchesFilters(marca, filters)).map((marca) => ({
        marca,
        relevancia: 0,
        matchType: "partial" as const,
      }))

  const total = allResults.length
  const isPaginated = limit > 0
  const totalPages = isPaginated ? Math.max(1, Math.ceil(total / limit)) : 1
  const from = isPaginated ? (page - 1) * limit : 0
  const results = isPaginated ? allResults.slice(from, from + limit) : allResults

  return {
    results,
    total,
    page,
    totalPages,
    limit: isPaginated ? limit : total || 0,
    source: "seed",
  }
}

function mapRowToMarca(row: TrademarkRecordRow): Marca {
  const fecha = row.fecha_registro ?? row.fecha_presentacion ?? row.fecha_resolucion ?? ""
  const estado = row.estado === "Registrada" || row.estado === "Pendiente" || row.estado === "Denegada"
    ? row.estado
    : "Pendiente"

  return {
    id: row.id,
    nombre: row.nombre,
    solicitante: row.solicitante ?? "",
    numeroRegistro: row.numero_registro ?? "",
    estado,
    fecha,
    pais: row.pais ?? "CL",
    niza: (row.trademark_record_niza ?? []).map((item) => item.code),
    viena: (row.trademark_record_viena ?? []).map((item) => item.code),
    metadata: {
      ...(row.metadata ?? {}),
      source: row.source,
      source_record_id: row.source_record_id,
      numero_solicitud: row.numero_solicitud,
      source_url: row.source_url,
    },
  }
}

function matchesFilters(marca: Marca, filters: SearchFilters) {
  if (filters.estado && marca.estado !== filters.estado) return false
  if (filters.pais && marca.pais !== filters.pais.toUpperCase()) return false
  if (filters.fechaDesde && new Date(marca.fecha) < new Date(filters.fechaDesde)) return false
  if (filters.fechaHasta && new Date(marca.fecha) > new Date(filters.fechaHasta)) return false
  if (filters.niza?.length && !filters.niza.some((item) => marca.niza.includes(item))) return false
  if (filters.viena?.length && !filters.viena.some((item) => marca.viena.includes(item))) return false
  return true
}
