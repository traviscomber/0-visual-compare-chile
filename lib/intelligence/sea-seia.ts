import "server-only"

import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const SEA_BASE = "https://seia.sea.gob.cl"
const SEARCH_PATH = "/busqueda/buscarProyectoResumenAction.php"
const MAX_LIMIT = 24

type SeaRawProject = {
  EXPEDIENTE_ID?: string
  EXPEDIENTE_NOMBRE?: string
  EXPEDIENTE_URL_PPAL?: string
  WORKFLOW_DESCRIPCION?: string
  REGION_NOMBRE?: string
  COMUNA_NOMBRE?: string
  DESCRIPCION_TIPOLOGIA?: string
  RAZON_INGRESO?: string
  TITULAR?: string
  INVERSION_MM?: string
  FECHA_PRESENTACION?: string
  FECHA_PRESENTACION_FORMAT?: string
  ESTADO_PROYECTO?: string
  ACTIVIDAD_ACTUAL?: string
}

type SeaResponse = {
  status?: boolean
  data?: SeaRawProject[]
  totalRegistros?: string
  recordsFiltered?: string
}

export type SeaSeiaProject = {
  source: "sea_seia"
  sourceRecordId: string
  name: string
  holder: string | null
  workflow: string | null
  region: string | null
  commune: string | null
  typology: string | null
  entryReason: string | null
  investmentUsdMillions: number | null
  presentationDate: string | null
  status: string | null
  currentActivity: string | null
  sourceUrl: string
  matchedQuery: string
  matchedField: "nombre" | "titular"
}

export async function searchSeaSeiaProjects(query: string, limit = 12): Promise<SeaSeiaProject[]> {
  const cleaned = query.trim().replace(/\s+/g, " ")
  if (cleaned.length < 2) return []
  const bounded = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(limit)))

  const [byHolder, byName] = await Promise.all([
    fetchSeaProjects(cleaned, "titular", bounded),
    fetchSeaProjects(cleaned, "nombre", bounded),
  ])

  const unique = new Map<string, SeaSeiaProject>()
  for (const project of [...byHolder, ...byName]) {
    const current = unique.get(project.sourceRecordId)
    if (!current || (project.matchedField === "titular" && current.matchedField !== "titular")) {
      unique.set(project.sourceRecordId, project)
    }
  }
  return [...unique.values()]
    .sort((a, b) => String(b.presentationDate ?? "").localeCompare(String(a.presentationDate ?? "")))
    .slice(0, bounded)
}

async function fetchSeaProjects(query: string, field: "nombre" | "titular", limit: number): Promise<SeaSeiaProject[]> {
  const url = new URL(SEARCH_PATH, SEA_BASE)
  url.searchParams.set(field, query)
  url.searchParams.set("offset", "1")
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("orderColumn", "FECHA_PRESENTACION")
  url.searchParams.set("orderDir", "desc")

  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent": "VIDENTIA/1.0 environmental-intelligence",
      "X-Requested-With": "XMLHttpRequest",
    },
  }, { attempts: 2, baseDelayMs: 500, timeoutMs: 12_000 })

  if (!response.ok) throw new Error(`SEA/SEIA respondió ${response.status}`)
  const buffer = await response.arrayBuffer()
  const text = new TextDecoder("iso-8859-1").decode(buffer)
  const payload = JSON.parse(text) as SeaResponse
  if (payload.status === false || !Array.isArray(payload.data)) return []

  return payload.data.flatMap(raw => {
    const id = String(raw.EXPEDIENTE_ID ?? "").trim()
    const name = clean(raw.EXPEDIENTE_NOMBRE)
    if (!id || !name) return []
    const sourceUrl = officialExpedientUrl(raw.EXPEDIENTE_URL_PPAL, id)
    return [{
      source: "sea_seia" as const,
      sourceRecordId: id,
      name,
      holder: nullable(raw.TITULAR),
      workflow: nullable(raw.WORKFLOW_DESCRIPCION),
      region: nullable(raw.REGION_NOMBRE),
      commune: nullable(raw.COMUNA_NOMBRE),
      typology: nullable(raw.DESCRIPCION_TIPOLOGIA),
      entryReason: nullable(raw.RAZON_INGRESO),
      investmentUsdMillions: finiteNumber(raw.INVERSION_MM),
      presentationDate: parseDate(raw.FECHA_PRESENTACION_FORMAT, raw.FECHA_PRESENTACION),
      status: nullable(raw.ESTADO_PROYECTO),
      currentActivity: nullable(raw.ACTIVIDAD_ACTUAL),
      sourceUrl,
      matchedQuery: query,
      matchedField: field,
    }]
  })
}

function officialExpedientUrl(value: string | undefined, id: string) {
  try {
    const url = new URL(value || `/expediente/expediente.php?id_expediente=${encodeURIComponent(id)}`, SEA_BASE)
    if (url.hostname !== "seia.sea.gob.cl") throw new Error("unexpected SEA host")
    url.protocol = "https:"
    return url.toString()
  } catch {
    return `${SEA_BASE}/expediente/expediente.php?id_expediente=${encodeURIComponent(id)}`
  }
}

function parseDate(formatted: string | undefined, unixSeconds: string | undefined) {
  const match = String(formatted ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  const seconds = Number(unixSeconds)
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  return new Date(seconds * 1000).toISOString().slice(0, 10)
}

function finiteNumber(value: string | undefined) {
  const number = Number(String(value ?? "").replace(",", "."))
  return Number.isFinite(number) ? number : null
}

function nullable(value: string | undefined) {
  const result = clean(value)
  return result || null
}

function clean(value: string | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}
