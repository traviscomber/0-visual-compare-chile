import "server-only"

import { createHash } from "node:crypto"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const GDELT_DOC_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc"
const ALLOWED_HOST = "api.gdeltproject.org"
const MAX_RESULTS = 50

type GdeltArticleRow = {
  url?: string
  title?: string
  seendate?: string
  domain?: string
  language?: string
  sourcecountry?: string
}

type GdeltPayload = {
  articles?: GdeltArticleRow[]
}

export type GdeltArticleSignal = {
  source: "gdelt_doc"
  sourceRecordId: string
  title: string
  url: string
  seenAt: string | null
  domain: string | null
  language: string | null
  sourceCountry: string | null
}

export async function searchGdeltArticles(
  query: string,
  options: { timespan?: string; limit?: number } = {},
): Promise<GdeltArticleSignal[]> {
  const cleanQuery = sanitizeQuery(query)
  if (cleanQuery.length < 2) return []

  const limit = Math.max(1, Math.min(MAX_RESULTS, Math.trunc(options.limit ?? 12)))
  const url = new URL(GDELT_DOC_ENDPOINT)
  if (url.hostname !== ALLOWED_HOST) throw new Error("GDELT DOC host rejected")
  url.searchParams.set("query", exactPhrase(cleanQuery))
  url.searchParams.set("mode", "artlist")
  url.searchParams.set("format", "json")
  url.searchParams.set("maxrecords", String(limit))
  url.searchParams.set("timespan", normalizeTimespan(options.timespan ?? "7d"))
  url.searchParams.set("sort", "datedesc")

  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "VIDENTIA/1.0 global-intelligence",
    },
  }, { attempts: 2, baseDelayMs: 600, timeoutMs: 12_000 })

  if (!response.ok) throw new Error(`GDELT DOC respondió ${response.status}`)
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("json")) throw new Error("GDELT DOC devolvió un formato no JSON")

  const payload = await response.json() as GdeltPayload
  const unique = new Map<string, GdeltArticleSignal>()
  for (const row of payload.articles ?? []) {
    const articleUrl = normalizeArticleUrl(row.url)
    const title = cleanText(row.title)
    if (!articleUrl || !title) continue
    const sourceRecordId = createHash("sha256").update(articleUrl).digest("hex").slice(0, 24)
    unique.set(sourceRecordId, {
      source: "gdelt_doc",
      sourceRecordId,
      title,
      url: articleUrl,
      seenAt: normalizeSeenDate(row.seendate),
      domain: cleanText(row.domain),
      language: cleanText(row.language),
      sourceCountry: cleanText(row.sourcecountry),
    })
  }
  return [...unique.values()].slice(0, limit)
}

function sanitizeQuery(value: string) {
  return value.replace(/[\u0000-\u001f]/g, " ").replace(/["()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)
}

function exactPhrase(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`
}

function normalizeTimespan(value: string) {
  const normalized = value.trim().toLowerCase()
  return /^([1-9]|[1-9]\d)(min|h|hours|d|days|w|weeks|m|months)$/.test(normalized) ? normalized : "7d"
}

function normalizeArticleUrl(value?: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

function normalizeSeenDate(value?: string) {
  if (!value) return null
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
  if (!match) return null
  const [, year, month, day, hour, minute, second] = match
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || null
}
