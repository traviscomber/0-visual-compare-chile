import "server-only"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const CMF_RECENT_NORMS_URL = "https://www.cmfchile.cl/institucional/legislacion_normativa/normativa2.php?ultima=mes"
const CMF_ORIGIN = "https://www.cmfchile.cl"
const MAX_RESULTS = 25

export type CmfRegulatorySignal = {
  source: "cmf_norms"
  sourceRecordId: string
  title: string
  sourceUrl: string
  publishedAt: string | null
  normType: string | null
  number: string | null
  status: string | null
}

export async function searchCmfRegulations(query: string, limit = 12): Promise<CmfRegulatorySignal[]> {
  const normalized = normalizeText(query)
  if (normalized.length < 2) return []

  const safeLimit = Math.max(1, Math.min(MAX_RESULTS, Math.trunc(limit)))
  const response = await fetchWithRetry(CMF_RECENT_NORMS_URL, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "VIDENTIA/1.0 regulatory-intelligence",
    },
  }, { attempts: 2, baseDelayMs: 500, timeoutMs: 12_000 })

  if (!response.ok) throw new Error(`CMF normativa respondió ${response.status}`)

  const html = await response.text()
  const rows = extractRows(html)
  const matches: CmfRegulatorySignal[] = []

  for (const row of rows) {
    const searchable = normalizeText(`${row.title} ${row.normType ?? ""} ${row.number ?? ""}`)
    if (!searchable.includes(normalized)) continue
    matches.push(row)
    if (matches.length >= safeLimit) break
  }

  return matches
}

function extractRows(html: string): CmfRegulatorySignal[] {
  const decoded = decodeHtml(html)
  const trPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
  const rows: CmfRegulatorySignal[] = []

  for (const match of decoded.matchAll(trPattern)) {
    const body = match[1] ?? ""
    const cells = [...body.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => cleanText(cell[1] ?? ""))
    if (cells.length < 4) continue

    const normType = normalizeNormType(cells[0])
    const number = cleanScalar(cells[1])
    const publishedAt = parseChileanDate(cells[2])
    const title = cleanScalar(cells[3])
    if (!normType || !number || !title) continue

    const href = body.match(/href=["']([^"']+)["']/i)?.[1] ?? null
    const sourceUrl = normalizeCmfUrl(href) ?? CMF_RECENT_NORMS_URL
    const status = extractStatus(cells)
    const sourceRecordId = `${normType}:${number}:${publishedAt ?? "unknown"}`.toLowerCase()

    rows.push({
      source: "cmf_norms",
      sourceRecordId,
      title,
      sourceUrl,
      publishedAt,
      normType,
      number,
      status,
    })
  }

  return dedupe(rows)
}

function normalizeNormType(value: string) {
  const text = value.toUpperCase().replace(/\s+/g, " ").trim()
  const match = text.match(/\b(NCG|CIR|OFC)\b/)
  return match?.[1] ?? null
}

function parseChileanDate(value: string) {
  const match = value.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function extractStatus(cells: string[]) {
  const text = cells.join(" ")
  if (/derogad[ao]/i.test(text)) return "derogada"
  if (/vigente/i.test(text)) return "vigente"
  return null
}

function normalizeCmfUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value, CMF_ORIGIN)
    if (!/(^|\.)cmfchile\.cl$/i.test(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

function normalizeText(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function cleanScalar(value: string) {
  return cleanText(value).replace(/\s+/g, " ").trim()
}

function cleanText(value: string) {
  return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
}

function dedupe(values: CmfRegulatorySignal[]) {
  return [...new Map(values.map(item => [item.sourceRecordId, item])).values()]
}
