import "server-only"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const TENDERS_URL = "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json"
const PORTAL_URL = "https://www.mercadopublico.cl/"
const CACHE_TTL_MS = 5 * 60 * 1000

type JsonRecord = Record<string, unknown>
type CacheEntry = { expiresAt: number; rows: MercadoPublicoWatchTender[] }

let activeTenderCache: CacheEntry | null = null

export type MercadoPublicoWatchTender = {
  code: string
  name: string
  description: string | null
  status: string | null
  statusCode: number | null
  closingDate: string | null
  buyer: string | null
  buyingUnit: string | null
  region: string | null
  sourceUrl: string
}

export function hasMercadoPublicoWatchCredentials() {
  return Boolean(process.env.CHILECOMPRA_TICKET?.trim())
}

export async function searchMercadoPublicoTenders(query: string, limit = 12): Promise<MercadoPublicoWatchTender[]> {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery || !hasMercadoPublicoWatchCredentials()) return []

  const rows = await loadActiveTenders()
  const tokens = normalizedQuery.split(" ").filter(token => token.length >= 3)

  return rows
    .map(row => ({ row, score: matchScore(row, normalizedQuery, tokens) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || compareDates(a.row.closingDate, b.row.closingDate))
    .slice(0, Math.min(Math.max(limit, 1), 25))
    .map(item => item.row)
}

async function loadActiveTenders() {
  const now = Date.now()
  if (activeTenderCache && activeTenderCache.expiresAt > now) return activeTenderCache.rows

  const ticket = process.env.CHILECOMPRA_TICKET?.trim()
  if (!ticket) return []

  const url = new URL(TENDERS_URL)
  url.searchParams.set("estado", "activas")
  url.searchParams.set("ticket", ticket)

  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "VIDENTIA/1.0" },
  }, { attempts: 2, baseDelayMs: 700, timeoutMs: 15_000 })

  if (!response.ok) throw new Error(`Mercado Público respondió ${response.status}`)

  const payload = await response.json() as JsonRecord
  const rows = tenderRows(payload)
    .map(normalizeTender)
    .filter((row): row is MercadoPublicoWatchTender => Boolean(row))

  activeTenderCache = { expiresAt: now + CACHE_TTL_MS, rows }
  return rows
}

function tenderRows(payload: JsonRecord): JsonRecord[] {
  const listado = payload.Listado ?? payload.listado
  if (Array.isArray(listado)) return listado.filter(isRecord)
  if (isRecord(listado)) {
    const nested = listado.Licitacion ?? listado.licitacion
    if (Array.isArray(nested)) return nested.filter(isRecord)
    if (isRecord(nested)) return [nested]
  }
  return []
}

function normalizeTender(row: JsonRecord): MercadoPublicoWatchTender | null {
  const code = text(row.CodigoExterno ?? row.codigoExterno)
  const name = text(row.Nombre ?? row.nombre)
  if (!code || !name) return null

  const buyerRaw = row.Comprador ?? row.comprador
  const buyer = isRecord(buyerRaw) ? buyerRaw : {}

  return {
    code,
    name,
    description: text(row.Descripcion ?? row.descripcion),
    status: text(row.Estado ?? row.estado),
    statusCode: numberValue(row.CodigoEstado ?? row.codigoEstado),
    closingDate: isoDate(row.FechaCierre ?? row.fechaCierre),
    buyer: text(buyer.NombreOrganismo ?? buyer.nombreOrganismo),
    buyingUnit: text(buyer.NombreUnidad ?? buyer.nombreUnidad),
    region: text(buyer.RegionUnidad ?? buyer.regionUnidad),
    sourceUrl: PORTAL_URL,
  }
}

function matchScore(row: MercadoPublicoWatchTender, normalizedQuery: string, tokens: string[]) {
  const name = normalizeText(row.name)
  const description = normalizeText(row.description ?? "")
  const buyer = normalizeText([row.buyer, row.buyingUnit, row.region].filter(Boolean).join(" "))
  const all = `${name} ${description} ${buyer}`

  let score = 0
  if (name.includes(normalizedQuery)) score += 10
  else if (all.includes(normalizedQuery)) score += 7

  for (const token of tokens) {
    if (name.includes(token)) score += 3
    else if (description.includes(token)) score += 2
    else if (buyer.includes(token)) score += 1
  }
  return score
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function compareDates(left: string | null, right: string | null) {
  const a = left ? Date.parse(left) : Number.POSITIVE_INFINITY
  const b = right ? Date.parse(right) : Number.POSITIVE_INFINITY
  return a - b
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isoDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
