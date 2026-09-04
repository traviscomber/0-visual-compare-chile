import "server-only"

import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const SNIFA_BASE = "https://snifa.sma.gob.cl"
const SNIFA_RESULTS_PATH = "/RegistroPublico/Resultado"
const MAX_RESULTS = 20

export type SnifaFirmSanction = {
  source: "snifa_sma"
  sourceRecordId: string
  expediente: string
  unitName: string
  holderName: string
  category: string | null
  region: string | null
  fineUta: number | null
  paymentStatus: string | null
  sourceUrl: string
}

export async function searchSnifaFirmSanctions(query: string, limit = 12): Promise<SnifaFirmSanction[]> {
  const normalizedQuery = normalizeEntity(query)
  if (normalizedQuery.length < 2) return []

  const safeLimit = Math.max(1, Math.min(MAX_RESULTS, Math.trunc(limit)))
  const response = await fetchWithRetry(new URL(SNIFA_RESULTS_PATH, SNIFA_BASE), {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "VIDENTIA/1.0 external-intelligence",
    },
  }, { attempts: 2, baseDelayMs: 500, timeoutMs: 15_000 })

  if (!response.ok) throw new Error(`SNIFA Registro Público respondió ${response.status}`)
  const html = await response.text()
  const sanctions = parseFirmSanctions(html)
    .filter(item => entityMatches(item, normalizedQuery))
    .slice(0, safeLimit)

  return sanctions
}

export function parseFirmSanctions(html: string): SnifaFirmSanction[] {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  const results: SnifaFirmSanction[] = []

  for (const rowMatch of rows) {
    const rowHtml = rowMatch[1] ?? ""
    const detailMatch = rowHtml.match(/href=["']([^"']*\/RegistroPublico\/Ficha\/(\d+))[^"']*["']/i)
    if (!detailMatch) continue

    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => cleanVisibleText(match[1] ?? ""))
    if (cells.length < 8) continue

    const expediente = cells[1]?.trim() ?? ""
    const unitName = cells[2]?.trim() ?? ""
    const holderName = cells[3]?.trim() ?? ""
    if (!expediente || !unitName || !holderName) continue

    const sourceRecordId = detailMatch[2]
    const sourceUrl = normalizeSnifaUrl(detailMatch[1])
    if (!sourceRecordId || !sourceUrl) continue

    results.push({
      source: "snifa_sma",
      sourceRecordId,
      expediente,
      unitName,
      holderName,
      category: cells[4]?.trim() || null,
      region: cells[5]?.trim() || null,
      fineUta: parseFine(cells[6]),
      paymentStatus: cells[7]?.trim() || null,
      sourceUrl,
    })
  }

  return dedupe(results)
}

function entityMatches(item: SnifaFirmSanction, normalizedQuery: string) {
  const holder = normalizeEntity(item.holderName)
  const unit = normalizeEntity(item.unitName)
  return holder.includes(normalizedQuery) || unit.includes(normalizedQuery)
}

function normalizeSnifaUrl(value: string) {
  try {
    const url = new URL(value, SNIFA_BASE)
    if (url.hostname !== "snifa.sma.gob.cl") return null
    url.protocol = "https:"
    return url.toString()
  } catch {
    return null
  }
}

function parseFine(value?: string) {
  if (!value) return null
  const match = value.replace(/\s+/g, " ").match(/([\d.]+(?:,\d+)?)/)
  if (!match) return null
  const normalized = match[1].replace(/\./g, "").replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function dedupe(items: SnifaFirmSanction[]) {
  const map = new Map<string, SnifaFirmSanction>()
  for (const item of items) map.set(item.sourceRecordId, item)
  return [...map.values()]
}

function cleanVisibleText(value: string) {
  return decodeHtml(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
}

function normalizeEntity(value: string) {
  return cleanVisibleText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
