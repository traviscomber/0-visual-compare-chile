import "server-only"
import { createHash } from "node:crypto"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"

export type GoogleNewsSignal = {
  source: "google_news_rss"
  sourceRecordId: string
  title: string
  date: string | null
  url: string
  publisher: string | null
}

export type GoogleNewsMarket = "chile" | "global"

export async function searchGoogleNews(
  query: string,
  from: Date,
  to: Date,
  limit = 10,
  market: GoogleNewsMarket = "global",
): Promise<GoogleNewsSignal[]> {
  const normalized = query.replace(/[\u0000-\u001f]/g, " ").trim()
  if (!normalized) return []

  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000))
  const boundedFrom = isoDay(from)
  const boundedToExclusive = isoDay(new Date(to.getTime() + 86400000))
  const temporalQuery = days <= 30
    ? `when:${days}d`
    : `after:${boundedFrom} before:${boundedToExclusive}`

  const url = new URL(GOOGLE_NEWS_RSS)
  url.searchParams.set("q", `${normalized} ${temporalQuery}`)

  if (market === "chile") {
    url.searchParams.set("hl", "es-419")
    url.searchParams.set("gl", "CL")
    url.searchParams.set("ceid", "CL:es-419")
  } else {
    url.searchParams.set("hl", "en-US")
    url.searchParams.set("gl", "US")
    url.searchParams.set("ceid", "US:en")
  }

  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: { Accept: "application/rss+xml, application/xml, text/xml", "User-Agent": "VIDENTIA/1.0" },
  }, { attempts: 2, baseDelayMs: 500, timeoutMs: 12_000 })
  if (!response.ok) throw new Error(`Google News RSS respondió ${response.status}`)

  const xml = await response.text()
  const rows: GoogleNewsSignal[] = []
  const itemPattern = /<item>([\s\S]*?)<\/item>/gi
  for (const match of xml.matchAll(itemPattern)) {
    const body = match[1] ?? ""
    const title = xmlText(body, "title")
    const link = xmlText(body, "link")
    if (!title || !link) continue
    const pubDate = xmlText(body, "pubDate")
    const parsedDate = pubDate ? new Date(pubDate) : null
    if (parsedDate && !Number.isNaN(parsedDate.getTime()) && (parsedDate < from || parsedDate > to)) continue
    const publisher = xmlText(body, "source")
    const isoDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null
    rows.push({
      source: "google_news_rss",
      sourceRecordId: createHash("sha256").update(`${link}|${title}`).digest("hex").slice(0, 32),
      title,
      date: isoDate,
      url: link,
      publisher,
    })
    if (rows.length >= Math.min(Math.max(limit, 1), 25)) break
  }
  return rows
}

function isoDay(value: Date) {
  return value.toISOString().slice(0, 10)
}

function xmlText(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))
  if (!match?.[1]) return null
  return decodeXml(match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim() || null
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
}
