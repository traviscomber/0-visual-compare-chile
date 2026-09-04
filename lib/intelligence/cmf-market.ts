import "server-only"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const CMF_API_ROOT = "https://api.cmfchile.cl/api-sbifv3/recursos_api"
const TIMEOUT_MS = 10_000

export type CmfMarketIndicator = {
  source: "cmf_market"
  sourceRecordId: string
  indicator: "dolar" | "uf" | "euro" | "ipc"
  label: string
  value: string
  date: string
  sourceUrl: string
}

type IndicatorDefinition = {
  resource: CmfMarketIndicator["indicator"]
  label: string
  aliases: string[]
}

const INDICATORS: IndicatorDefinition[] = [
  { resource: "dolar", label: "Dólar observado", aliases: ["dolar", "dólar", "usd", "tipo de cambio", "exchange rate"] },
  { resource: "uf", label: "Unidad de Fomento", aliases: ["uf", "unidad de fomento"] },
  { resource: "euro", label: "Euro", aliases: ["euro", "eur"] },
  { resource: "ipc", label: "IPC", aliases: ["ipc", "inflacion", "inflación", "indice de precios", "índice de precios"] },
]

export function hasCmfMarketCredentials() {
  return Boolean(readApiKey())
}

export function requestedCmfIndicators(query: string) {
  const normalized = normalize(query)
  return INDICATORS.filter(indicator => indicator.aliases.some(alias => matchesAlias(normalized, normalize(alias))))
}

export async function searchCmfMarketIndicators(query: string): Promise<CmfMarketIndicator[]> {
  const apiKey = readApiKey()
  if (!apiKey) return []

  const requested = requestedCmfIndicators(query)
  if (!requested.length) return []

  const groups = await Promise.all(requested.map(indicator => fetchIndicator(indicator, apiKey)))
  return groups.filter((item): item is CmfMarketIndicator => Boolean(item))
}

async function fetchIndicator(indicator: IndicatorDefinition, apiKey: string): Promise<CmfMarketIndicator | null> {
  const url = new URL(`${CMF_API_ROOT}/${indicator.resource}`)
  url.searchParams.set("apikey", apiKey)
  url.searchParams.set("formato", "json")

  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "VIDENTIA/1.0 market-intelligence",
    },
  }, { attempts: 2, baseDelayMs: 400, timeoutMs: TIMEOUT_MS })

  if (!response.ok) throw new Error(`CMF ${indicator.resource} respondió ${response.status}`)
  const payload = await response.json() as unknown
  const row = findIndicatorRow(payload)
  if (!row) return null

  const sourceUrl = `https://api.cmfchile.cl/documentacion/${documentationPage(indicator.resource)}`
  return {
    source: "cmf_market",
    sourceRecordId: `${indicator.resource}:${row.date}`,
    indicator: indicator.resource,
    label: indicator.label,
    value: row.value,
    date: row.date,
    sourceUrl,
  }
}

function findIndicatorRow(payload: unknown): { value: string; date: string } | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue
    for (const item of value) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue
      const record = item as Record<string, unknown>
      const indicatorValue = stringValue(record.Valor ?? record.valor ?? record.Value ?? record.value)
      const date = normalizeDate(stringValue(record.Fecha ?? record.fecha ?? record.Date ?? record.date))
      if (indicatorValue && date) return { value: indicatorValue, date }
    }
  }
  return null
}

function readApiKey() {
  return (process.env.CMF_API_KEY || process.env.SBIF_API_KEY || "").trim()
}

function documentationPage(resource: CmfMarketIndicator["indicator"]) {
  if (resource === "dolar") return "Dolar.html"
  if (resource === "uf") return "UF.html"
  if (resource === "euro") return "Euro.html"
  return "IPC.html"
}

function matchesAlias(query: string, alias: string) {
  if (alias.length <= 3) return new RegExp(`(^|\\s)${escapeRegex(alias)}($|\\s)`, "i").test(query)
  return query.includes(alias)
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function normalizeDate(value: string | null) {
  if (!value) return null
  const match = value.match(/\d{4}-\d{2}-\d{2}/)
  return match?.[0] ?? null
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
