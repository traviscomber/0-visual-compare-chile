import "server-only"

import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const FNE_BASE = "https://www.fne.gob.cl"
const SEARCH_PATH = "/search/operaciones_resultados.php"
const MAX_RESULTS = 24

export type FneCompetitionSignal = {
  source: "fne_competition"
  sourceRecordId: string
  title: string
  documentType: string
  sourceUrl: string
  publicationDate: string | null
  matchedQuery: string
}

export async function searchFneCompetition(query: string, limit = 12): Promise<FneCompetitionSignal[]> {
  const cleaned = query.trim().replace(/\s+/g, " ")
  if (cleaned.length < 2) return []

  const url = new URL(SEARCH_PATH, FNE_BASE)
  url.searchParams.set("AnoFin", "000")
  url.searchParams.set("AnoIni", "000")
  url.searchParams.set("Clave", "")
  url.searchParams.set("Conducta", "000")
  url.searchParams.set("Mercado", "000")
  url.searchParams.set("Partes", cleaned)
  url.searchParams.set("select1", "000")

  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "VIDENTIA/1.0 competition-intelligence",
    },
  }, { attempts: 2, baseDelayMs: 500, timeoutMs: 12_000 })

  if (!response.ok) throw new Error(`FNE respondió ${response.status}`)
  return parseFneResults(await response.text(), cleaned).slice(0, Math.max(1, Math.min(MAX_RESULTS, Math.trunc(limit))))
}

function parseFneResults(html: string, matchedQuery: string): FneCompetitionSignal[] {
  const rows: FneCompetitionSignal[] = []
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  for (const match of anchors) {
    const rawHref = decodeHtml(match[1] ?? "")
    const title = cleanVisibleText(match[2] ?? "")
    if (!rawHref || title.length < 12) continue
    const sourceUrl = normalizeOfficialUrl(rawHref)
    if (!sourceUrl || !/\.(?:pdf|docx?)(?:$|\?)/i.test(sourceUrl)) continue

    const after = html.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 500)
    const date = after.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/)
    const publicationDate = date ? `${date[3]}-${date[2]}-${date[1]}` : null
    const path = new URL(sourceUrl).pathname
    rows.push({
      source: "fne_competition",
      sourceRecordId: path,
      title,
      documentType: inferDocumentType(title),
      sourceUrl,
      publicationDate,
      matchedQuery,
    })
  }

  const unique = new Map<string, FneCompetitionSignal>()
  for (const row of rows) unique.set(row.sourceRecordId, row)
  return [...unique.values()].sort((a, b) => String(b.publicationDate ?? "").localeCompare(String(a.publicationDate ?? "")))
}

function inferDocumentType(title: string) {
  const normalized = normalizeText(title)
  if (normalized.includes("informe")) return "informe"
  if (normalized.includes("resolucion de inicio") || normalized.includes("resolucion de incio")) return "resolucion_inicio"
  if (normalized.includes("fase ii")) return "fase_ii"
  if (normalized.includes("prohib")) return "prohibicion"
  if (normalized.includes("aprob")) return "aprobacion"
  if (normalized.includes("archivo")) return "archivo"
  return "documento_fne"
}

function normalizeOfficialUrl(value: string) {
  try {
    const url = new URL(value, FNE_BASE)
    if (url.hostname !== "www.fne.gob.cl" && url.hostname !== "fne.gob.cl") return null
    url.protocol = "https:"
    return url.toString()
  } catch {
    return null
  }
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

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}
