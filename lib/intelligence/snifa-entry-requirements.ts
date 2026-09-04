import "server-only"

import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const SNIFA_BASE = "https://snifa.sma.gob.cl"
const RESULTS_PATH = "/RequerimientoIngreso/Resultado"
const MAX_RESULTS = 20

export type SnifaEntryRequirement = {
  source: "snifa_sma"
  sourceRecordId: string
  expediente: string
  unitName: string
  holderName: string
  category: string | null
  region: string | null
  startedAt: string | null
  latestActivityAt: string | null
  fiscalizationCount: number
  associatedProceedings: number
  sourceUrl: string
}

export async function searchSnifaEntryRequirements(query: string, limit = 12): Promise<SnifaEntryRequirement[]> {
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

  if (!response.ok) throw new Error(`SNIFA Requerimientos de Ingreso respondió ${response.status}`)
  const html = await response.text()
  const rows = parseEntryRequirements(html)
    .filter(item => normalizeEntity(item.holderName).includes(normalizedQuery))
    .slice(0, safeLimit)

  return Promise.all(rows.map(item => enrichEntryRequirement(item)))
}

export function parseEntryRequirements(html: string): SnifaEntryRequirement[] {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  const results: SnifaEntryRequirement[] = []

  for (const rowMatch of rows) {
    const rowHtml = rowMatch[1] ?? ""
    const detailMatch = rowHtml.match(/href=["']([^"']*\/RequerimientoIngreso\/Ficha\/(\d+))[^"']*["']/i)
    if (!detailMatch) continue

    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => cleanVisibleText(match[1] ?? ""))
    if (cells.length < 6) continue

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
      startedAt: null,
      latestActivityAt: null,
      fiscalizationCount: 0,
      associatedProceedings: 0,
      sourceUrl,
    })
  }

  return dedupe(results)
}

export function parseEntryRequirementDetail(html: string): Pick<SnifaEntryRequirement, "startedAt" | "latestActivityAt" | "fiscalizationCount" | "associatedProceedings"> {
  const text = cleanVisibleText(html)
  const dates = [...text.matchAll(/\b(\d{2})-(\d{2})-(\d{4})\b/g)]
    .map(match => `${match[3]}-${match[2]}-${match[1]}`)
    .filter(Boolean)
    .sort()
  const fiscalizationIds = new Set([...text.matchAll(/\bDFZ-\d{4}-\d+-[A-Z0-9-]+\b/gi)].map(match => match[0].toUpperCase()))
  const associatedMatch = text.match(/Sancionatorios asociados\s*\((\d+)\)/i)
  const noAssociated = /no tiene procesos sancionatorios asociados/i.test(text)

  return {
    startedAt: dates[0] ?? null,
    latestActivityAt: dates.at(-1) ?? null,
    fiscalizationCount: fiscalizationIds.size,
    associatedProceedings: associatedMatch ? Number(associatedMatch[1]) : noAssociated ? 0 : 0,
  }
}

async function enrichEntryRequirement(item: SnifaEntryRequirement): Promise<SnifaEntryRequirement> {
  try {
    const response = await fetchWithRetry(item.sourceUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "VIDENTIA/1.0 external-intelligence",
      },
    }, { attempts: 2, baseDelayMs: 400, timeoutMs: 10_000 })

    if (!response.ok) return item
    return { ...item, ...parseEntryRequirementDetail(await response.text()) }
  } catch (error) {
    console.warn("[snifa] entry requirement detail unavailable", { sourceRecordId: item.sourceRecordId, error })
    return item
  }
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

function dedupe(items: SnifaEntryRequirement[]) {
  const map = new Map<string, SnifaEntryRequirement>()
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
