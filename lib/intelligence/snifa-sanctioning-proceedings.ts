import "server-only"

import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const SNIFA_BASE = "https://snifa.sma.gob.cl"
const RESULTS_PATH = "/Sancionatorio/Resultado"
const MAX_RESULTS = 20

export type SnifaSanctioningProceeding = {
  source: "snifa_sma"
  sourceRecordId: string
  expediente: string
  unitName: string
  holderName: string
  category: string | null
  region: string | null
  status: string | null
  active: boolean
  startedAt: string | null
  latestActivityAt: string | null
  infringementCount: number
  gravisimaCount: number
  graveCount: number
  leveCount: number
  sourceUrl: string
}

export async function searchSnifaActiveSanctioningProceedings(query: string, limit = 12): Promise<SnifaSanctioningProceeding[]> {
  const normalizedQuery = normalizeEntity(query)
  if (normalizedQuery.length < 2) return []

  const safeLimit = Math.max(1, Math.min(MAX_RESULTS, Math.trunc(limit)))
  const response = await fetchWithRetry(new URL(RESULTS_PATH, SNIFA_BASE), {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "VIDENTIA/1.0 external-intelligence",
    },
  }, { attempts: 2, baseDelayMs: 500, timeoutMs: 15_000 })

  if (!response.ok) throw new Error(`SNIFA Procedimientos Sancionatorios respondió ${response.status}`)
  const html = await response.text()
  const rows = parseSanctioningProceedings(html)
    .filter(item => item.active)
    .filter(item => normalizeEntity(item.holderName).includes(normalizedQuery))
    .slice(0, safeLimit)

  return Promise.all(rows.map(item => enrichSanctioningProceeding(item)))
}

export function parseSanctioningProceedings(html: string): SnifaSanctioningProceeding[] {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  const results: SnifaSanctioningProceeding[] = []

  for (const rowMatch of rows) {
    const rowHtml = rowMatch[1] ?? ""
    const detailMatch = rowHtml.match(/href=["']([^"']*\/Sancionatorio\/Ficha\/(\d+))[^"']*["']/i)
    if (!detailMatch) continue

    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => cleanVisibleText(match[1] ?? ""))
    if (cells.length < 7) continue

    const expediente = cells[1]?.trim() ?? ""
    const unitName = cells[2]?.trim() ?? ""
    const holderName = cells[3]?.trim() ?? ""
    if (!expediente || !unitName || !holderName) continue

    const sourceRecordId = detailMatch[2]
    const sourceUrl = normalizeSnifaUrl(detailMatch[1])
    if (!sourceRecordId || !sourceUrl) continue

    const status = cells[6]?.trim() || null
    results.push({
      source: "snifa_sma",
      sourceRecordId,
      expediente,
      unitName,
      holderName,
      category: cells[4]?.trim() || null,
      region: cells[5]?.trim() || null,
      status,
      active: isActiveStatus(status),
      startedAt: null,
      latestActivityAt: null,
      infringementCount: 0,
      gravisimaCount: 0,
      graveCount: 0,
      leveCount: 0,
      sourceUrl,
    })
  }

  return dedupe(results)
}

export function parseSanctioningProceedingDetail(html: string): Pick<SnifaSanctioningProceeding, "startedAt" | "latestActivityAt" | "infringementCount" | "gravisimaCount" | "graveCount" | "leveCount"> {
  const text = cleanVisibleText(html)
  const dates = [...text.matchAll(/\b(\d{2})-(\d{2})-(\d{4})\b/g)]
    .map(match => `${match[3]}-${match[2]}-${match[1]}`)
    .filter(Boolean)
    .sort()
  const classifications = [...html.matchAll(/<td\b[^>]*>\s*(Grav[ií]simas?|Graves?|Leves?)\s*<\/td>/gi)].map(match => normalizeEntity(match[1]))

  return {
    startedAt: dates[0] ?? null,
    latestActivityAt: dates.at(-1) ?? null,
    infringementCount: classifications.length,
    gravisimaCount: classifications.filter(value => value.startsWith("gravisima")).length,
    graveCount: classifications.filter(value => value === "grave" || value === "graves").length,
    leveCount: classifications.filter(value => value === "leve" || value === "leves").length,
  }
}

async function enrichSanctioningProceeding(item: SnifaSanctioningProceeding): Promise<SnifaSanctioningProceeding> {
  try {
    const response = await fetchWithRetry(item.sourceUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "VIDENTIA/1.0 external-intelligence",
      },
    }, { attempts: 2, baseDelayMs: 400, timeoutMs: 10_000 })

    if (!response.ok) return item
    return { ...item, ...parseSanctioningProceedingDetail(await response.text()) }
  } catch (error) {
    console.warn("[snifa] sanctioning proceeding detail unavailable", { sourceRecordId: item.sourceRecordId, error })
    return item
  }
}

function isActiveStatus(status: string | null) {
  if (!status) return true
  const normalized = normalizeEntity(status)
  return !["terminado", "finalizado", "cerrado", "archivado"].some(token => normalized.includes(token))
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

function dedupe(items: SnifaSanctioningProceeding[]) {
  const map = new Map<string, SnifaSanctioningProceeding>()
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
