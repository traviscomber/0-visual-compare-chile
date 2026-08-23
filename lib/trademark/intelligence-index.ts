import { createAdminClient } from "@/lib/supabase/admin"
import type { Marca } from "@/types/marca"

interface IndexRow {
  id: string
  source_record_id: string | null
  nombre: string
  solicitante: string
  numero_registro: string
  numero_solicitud: string
  estado: string
  pais: string
  image_url: string | null
  niza: string[] | null
  viena: string[] | null
  name_similarity: number
  niza_overlap: number
}

export interface TrademarkIndexSearchResult {
  rows: Marca[]
  rawCount: number
  source: "n3uralia-index"
}

export async function searchTrademarkIntelligenceIndex(
  query: string,
  requestedClasses: Array<string | number> = [],
  limit = 50,
): Promise<TrademarkIndexSearchResult> {
  const normalized = query.trim()
  if (!normalized) return { rows: [], rawCount: 0, source: "n3uralia-index" }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("search_trademark_intelligence_index", {
    p_query: normalized,
    p_niza: requestedClasses.map(String),
    p_limit: Math.max(1, Math.min(limit, 100)),
  })

  if (error) throw new Error(`Trademark intelligence index unavailable: ${error.message}`)

  const rows = ((data ?? []) as IndexRow[]).map(rowToMarca)
  return { rows, rawCount: rows.length, source: "n3uralia-index" }
}

function rowToMarca(row: IndexRow): Marca {
  const estado = canonicalState(row.estado)
  return {
    id: row.numero_solicitud || row.source_record_id || row.id,
    nombre: row.nombre,
    solicitante: row.solicitante || "",
    numeroRegistro: row.numero_registro || "",
    estado,
    fecha: "",
    pais: row.pais || "CL",
    niza: row.niza ?? [],
    viena: row.viena ?? [],
    ...(row.image_url ? { imagenUrl: row.image_url } : {}),
    metadata: {
      numSolicitud: row.numero_solicitud || undefined,
      sourceRecordId: row.source_record_id || undefined,
      intelligenceIndexId: row.id,
      indexNameSimilarity: Number(row.name_similarity ?? 0),
      indexNizaOverlap: Number(row.niza_overlap ?? 0),
      discoverySource: "n3uralia-index",
    },
  }
}

function canonicalState(value: string): Marca["estado"] {
  const normalized = value.toLowerCase()
  if (normalized.includes("registr")) return "Registrada"
  if (normalized.includes("pend") || normalized.includes("tram")) return "Pendiente"
  if (normalized.includes("deneg") || normalized.includes("rechaz")) return "Denegada"
  return "No Vigente"
}
