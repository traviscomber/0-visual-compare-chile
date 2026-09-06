import "server-only"

import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const TDLC_BASE = "https://www.tdlc.cl"
const MAX_RESULTS = 24

type DecisionKind = "sentencia" | "resolucion"

export type TdlcCompetitionSignal = {
  source: "tdlc_jurisprudence"
  sourceRecordId: string
  decisionType: DecisionKind
  number: string
  role: string | null
  title: string
  sourceUrl: string
  publicationDate: string | null
  matchedQuery: string
}

export async function searchTdlcCompetition(query: string, limit = 12): Promise<TdlcCompetitionSignal[]> {
  const normalizedQuery = normalizeText(query)
  if (normalizedQuery.length < 2) return []

  const pages: Array<{ kind: DecisionKind; path: string }> = [
    { kind: "sentencia", path: "/sentencia/" },
    { kind: "resolucion", path: "/resoluciones/" },
  ]
  const results: TdlcCompetitionSignal[] = []

  for (const page of pages) {
    const response = await fetchWithRetry(new URL(page.path, TDLC_BASE), {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "VIDENTIA/1.0 competition-intelligence",
      },
    }, { attempts: 2, baseDelayMs: 500, timeoutMs: 12_000 })
    if (!response.ok) throw new Error(`TDLC ${page.kind} respondió ${response.status}`)
    results.push(...parseDecisionPage(await response.text(), page.kind, normalizedQuery, query))
  }

  const unique = new Map<string, TdlcCompetitionSignal>()
  for (const item of results) unique.set(item.sourceRecordId, item)
  return [...unique.values()]
    .sort((a, b) => String(b.publicationDate ?? "").localeCompare(String(a.publicationDate ?? "")))
    .slice(0, Math.max(1, Math.min(MAX_RESULTS, Math.trunc(limit))))
}

function parseDecisionPage(html: string, kind: DecisionKind, normalizedQuery: string, matchedQuery: string) {
  const slug = kind === "sentencia" ? "numero-de-sentencia" : "numero-de-resolucion"
  const regex = new RegExp(`<a\\b[^>]*href=["']([^"']*\\/${slug}\\/(\\d+)\\/?)["'][^>]*>([\\s\\S]*?)<\\/a>`, "gi")
  const rows: TdlcCompetitionSignal[] = []

  for (const match of html.matchAll(regex)) {
    const number = String(match[2] ?? "").trim()
    if (!number) continue
    const index = match.index ?? 0
    const before = html.slice(Math.max(0, index - 500), index)
    const after = html.slice(index, index + 1600)
    const visible = cleanVisibleText(after)
    const title = extractDecisionTitle(visible, kind, number)
    if (!title || !matchesQuery(title, normalizedQuery)) continue

    const date = cleanVisibleText(before).match(/(\d{2})\/(\d{2})\/(\d{2,4})(?![\s\S]*\d{2}\/\d{2}\/\d{2,4})/)
    const publicationDate = date ? normalizeDate(date[1], date[2], date[3]) : null
    const role = extractRole(title)
    const sourceUrl = normalizeOfficialUrl(match[1] ?? "")
    if (!sourceUrl) continue

    rows.push({
      source: "tdlc_jurisprudence",
      sourceRecordId: `${kind}:${number}`,
      decisionType: kind,
      number,
      role,
      title,
      sourceUrl,
      publicationDate,
      matchedQuery,
    })
  }

  return rows
}

function extractDecisionTitle(value: string, kind: DecisionKind, number: string) {
  const label = kind === "sentencia" ? "Sentencia" : "Resolución"
  const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = value.match(new RegExp(`${label}\\s+N[°º]?\\s*${escaped}(?:\\/\\d{4})?\\s*:\\s*(.+?)(?=\\s+Ver Ficha|$)`, "i"))
  if (!match?.[1]) return null
  return `${label} N° ${number}: ${match[1].trim()}`.slice(0, 900)
}

function extractRole(value: string) {
  const match = value.match(/\b(?:NC|CIP|AE|C)\s*(?:N[°º]?\s*)?\d+[-/]\d{2,4}\b/i)
  return match?.[0]?.replace(/\s+/g, " ").trim() ?? null
}

function matchesQuery(value: string, normalizedQuery: string) {
  const haystack = normalizeText(value)
  const tokens = normalizedQuery.split(" ").filter(token => token.length >= 3)
  if (!tokens.length) return haystack.includes(normalizedQuery)
  return haystack.includes(normalizedQuery) || tokens.every(token => haystack.includes(token))
}

function normalizeDate(day: string, month: string, rawYear: string) {
  const year = rawYear.length === 2 ? Number(rawYear) + 2000 : Number(rawYear)
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

function normalizeOfficialUrl(value: string) {
  try {
    const url = new URL(decodeHtml(value), TDLC_BASE)
    if (url.hostname !== "www.tdlc.cl" && url.hostname !== "tdlc.cl") return null
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
