import "server-only"

import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const DIARIO_OFICIAL_BASE = "https://www.diariooficial.interior.gob.cl"
const MAX_RESULTS = 30

export type DiarioOficialRegulatorySignal = {
  source: "diario_oficial"
  sourceRecordId: string
  title: string
  sourceUrl: string
  publicationDate: string
  edition: string | null
  cve: string
  section: string | null
}

export async function searchDiarioOficialRegulations(
  query: string,
  options: { days?: number; limit?: number; now?: Date } = {},
): Promise<DiarioOficialRegulatorySignal[]> {
  const normalizedQuery = normalizeText(query)
  if (normalizedQuery.length < 2) return []

  const days = Math.max(1, Math.min(7, Math.trunc(options.days ?? 3)))
  const limit = Math.max(1, Math.min(MAX_RESULTS, Math.trunc(options.limit ?? 12)))
  const now = options.now ?? new Date()
  const unique = new Map<string, DiarioOficialRegulatorySignal>()

  for (let offset = 0; offset < days && unique.size < limit; offset += 1) {
    const date = chileDateDaysAgo(now, offset)
    const url = new URL("/edicionelectronica/index.php", DIARIO_OFICIAL_BASE)
    url.searchParams.set("date", formatQueryDate(date))

    const response = await fetchWithRetry(url, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "VIDENTIA/1.0 regulatory-intelligence",
      },
    }, { attempts: 2, baseDelayMs: 500, timeoutMs: 12_000 })

    if (!response.ok) {
      if (response.status === 404) continue
      throw new Error(`Diario Oficial respondió ${response.status}`)
    }

    const html = await response.text()
    for (const item of parseEditionHtml(html, date)) {
      if (!matchesQuery(item, normalizedQuery)) continue
      unique.set(item.sourceRecordId, item)
      if (unique.size >= limit) break
    }
  }

  return [...unique.values()]
}

function parseEditionHtml(html: string, date: Date): DiarioOficialRegulatorySignal[] {
  const edition = extractEdition(html)
  const publicationDate = formatIsoDate(date)
  const rows: DiarioOficialRegulatorySignal[] = []
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']*\/publicaciones\/\d{4}\/\d{2}\/\d{2}\/\d+\/\d+\/(\d+)\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi)]

  for (const match of anchors) {
    const href = decodeHtml(match[1] ?? "")
    const cve = String(match[2] ?? "").trim()
    if (!href || !cve) continue

    const anchorStart = match.index ?? 0
    const contextStart = Math.max(0, anchorStart - 1800)
    const context = html.slice(contextStart, anchorStart)
    const title = extractTitle(context)
    if (!title) continue

    const sourceUrl = normalizeOfficialUrl(href)
    if (!sourceUrl) continue

    rows.push({
      source: "diario_oficial",
      sourceRecordId: cve,
      title,
      sourceUrl,
      publicationDate,
      edition,
      cve,
      section: extractSection(context),
    })
  }

  return dedupe(rows)
}

function extractEdition(html: string) {
  const match = cleanVisibleText(html).match(/Edici[oó]n\s+(?:N[uú]m\.?\s*)?([\d.]+)/i)
  return match?.[1]?.replace(/\./g, "") ?? null
}

function extractTitle(context: string) {
  const lines = visibleLines(context)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = lines[index]
    if (!candidate) continue
    if (/^(ver pdf(?:\s*\(cve[-\s]*\d+\))?|sumario|normas generales|poder ejecutivo)$/i.test(candidate)) continue
    if (/^(ministerio|subsecretar[ií]a|servicio|direcci[oó]n|comisi[oó]n)\b/i.test(candidate) && candidate.length < 90) continue
    if (candidate.length >= 12 && candidate.length <= 700) return candidate
  }
  return null
}

function extractSection(context: string) {
  const lines = visibleLines(context)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = lines[index]
    if (/^(MINISTERIO|SUBSECRETAR[IÍ]A|SERVICIO|DIRECCI[OÓ]N|COMISI[OÓ]N)\b/i.test(candidate)) return candidate.slice(0, 180)
  }
  return null
}

function matchesQuery(item: DiarioOficialRegulatorySignal, normalizedQuery: string) {
  const haystack = normalizeText([item.title, item.section].filter(Boolean).join(" "))
  const tokens = normalizedQuery.split(" ").filter(token => token.length >= 3)
  if (!tokens.length) return haystack.includes(normalizedQuery)
  return haystack.includes(normalizedQuery) || tokens.every(token => haystack.includes(token))
}

function normalizeOfficialUrl(value: string) {
  try {
    const url = new URL(value, DIARIO_OFICIAL_BASE)
    if (url.hostname !== "www.diariooficial.interior.gob.cl" && url.hostname !== "diariooficial.interior.gob.cl") return null
    url.protocol = "https:"
    return url.toString()
  } catch {
    return null
  }
}

function dedupe(items: DiarioOficialRegulatorySignal[]) {
  const map = new Map<string, DiarioOficialRegulatorySignal>()
  for (const item of items) map.set(item.sourceRecordId, item)
  return [...map.values()]
}

function chileDateDaysAgo(reference: Date, days: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference)
  const year = Number(parts.find(part => part.type === "year")?.value)
  const month = Number(parts.find(part => part.type === "month")?.value)
  const day = Number(parts.find(part => part.type === "day")?.value)
  const utc = new Date(Date.UTC(year, month - 1, day))
  utc.setUTCDate(utc.getUTCDate() - days)
  return utc
}

function formatQueryDate(value: Date) {
  return `${String(value.getUTCDate()).padStart(2, "0")}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${value.getUTCFullYear()}`
}

function formatIsoDate(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`
}

function stripTags(value: string) {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
}

function visibleLines(value: string) {
  const withBreaks = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:div|p|li|tr|td|th|h[1-6]|section|article)>/gi, "\n")
  return decodeHtml(withBreaks.replace(/<[^>]+>/g, " "))
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
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

function cleanVisibleText(value: string) {
  return decodeHtml(stripTags(value)).replace(/\s+/g, " ").trim()
}

function normalizeText(value: string) {
  return cleanVisibleText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}
