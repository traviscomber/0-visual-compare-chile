import "server-only"
import { createHash } from "node:crypto"

const TRUSTED_HOST = "patentscope.wipo.int"
const TIMEOUT_MS = 12000
const MAX_BYTES = 2_000_000
const MAX_ITEMS = 100

export type WipoRssAvailability = "available" | "degraded"

export type WipoPatentScopeItem = {
  sourceRecordId: string
  publicationNumber: string | null
  title: string
  publicationDate: string | null
  url: string
  description: string | null
}

export type WipoPatentScopeFeed = {
  source: "WIPO PATENTSCOPE RSS"
  availability: WipoRssAvailability
  feedUrl: string
  title: string | null
  items: WipoPatentScopeItem[]
  retrievedAt: string
}

export function validateWipoPatentScopeRssUrl(value: string) {
  let url: URL
  try { url = new URL(value.trim()) } catch { throw new Error("URL RSS de PATENTSCOPE inválida.") }
  if (url.protocol !== "https:") throw new Error("PATENTSCOPE RSS debe usar HTTPS.")
  if (url.hostname.toLowerCase() !== TRUSTED_HOST) throw new Error("La fuente RSS debe pertenecer a patentscope.wipo.int.")
  if (url.username || url.password) throw new Error("La URL RSS no puede incluir credenciales.")
  if (!url.pathname.startsWith("/search/")) throw new Error("La URL no corresponde al servicio de búsqueda PATENTSCOPE.")
  if (url.toString().length > 2048) throw new Error("La URL RSS es demasiado larga.")
  return url.toString()
}

export async function fetchWipoPatentScopeRss(value: string, limit = 40): Promise<WipoPatentScopeFeed> {
  const feedUrl = validateWipoPatentScopeRssUrl(value)
  const response = await fetch(feedUrl, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.2",
      "User-Agent": "VIDENTIA/1.0 (+https://videntia.app)",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`PATENTSCOPE RSS respondió ${response.status}.`)

  const finalUrl = new URL(response.url || feedUrl)
  if (finalUrl.protocol !== "https:" || finalUrl.hostname.toLowerCase() !== TRUSTED_HOST) {
    throw new Error("PATENTSCOPE RSS redirigió fuera del host oficial.")
  }

  const declaredLength = Number(response.headers.get("content-length") ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) throw new Error("PATENTSCOPE RSS excede el tamaño permitido.")

  const xml = await response.text()
  if (xml.length > MAX_BYTES) throw new Error("PATENTSCOPE RSS excede el tamaño permitido.")
  return parseWipoPatentScopeRss(xml, finalUrl.toString(), limit)
}

export function parseWipoPatentScopeRss(xml: string, feedUrl: string, limit = 40): WipoPatentScopeFeed {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("PATENTSCOPE RSS contiene declaraciones XML no permitidas.")
  if (!/<(?:rss|feed)\b/i.test(xml)) throw new Error("La respuesta no parece ser un feed RSS/Atom de PATENTSCOPE.")

  const itemBlocks = [...xml.matchAll(/<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi)]
    .slice(0, Math.min(Math.max(limit, 1), MAX_ITEMS))
    .map(match => match[1])

  const items = itemBlocks.flatMap(block => {
    const title = cleanText(tagValue(block, "title"))
    const link = itemLink(block)
    if (!title || !link) return []
    const safeLink = safeWipoLink(link)
    if (!safeLink) return []
    const guid = cleanText(tagValue(block, "guid") || tagValue(block, "id"))
    const dateRaw = cleanText(tagValue(block, "pubDate") || tagValue(block, "published") || tagValue(block, "updated") || tagValue(block, "dc:date"))
    const publicationDate = dateOnly(dateRaw)
    const publicationNumber = extractPublicationNumber(`${title} ${guid ?? ""} ${safeLink}`)
    const sourceRecordId = guid || publicationNumber || createHash("sha256").update(`${safeLink}|${title}|${publicationDate ?? ""}`).digest("hex")
    return [{
      sourceRecordId: sourceRecordId.slice(0, 500),
      publicationNumber,
      title: title.slice(0, 500),
      publicationDate,
      url: safeLink,
      description: cleanText(tagValue(block, "description") || tagValue(block, "summary") || tagValue(block, "content"))?.slice(0, 1500) ?? null,
    } satisfies WipoPatentScopeItem]
  })

  return {
    source: "WIPO PATENTSCOPE RSS",
    availability: "available",
    feedUrl,
    title: cleanText(tagValue(xml, "channel") ? tagValue(tagValue(xml, "channel")!, "title") : tagValue(xml, "title"))?.slice(0, 300) ?? null,
    items: dedupe(items),
    retrievedAt: new Date().toISOString(),
  }
}

function itemLink(block: string) {
  const simple = tagValue(block, "link")
  if (simple && !/^\s*$/.test(simple)) return stripMarkup(simple)
  const href = block.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1]
  return href ? decodeEntities(href) : null
}

function safeWipoLink(value: string) {
  try {
    const url = new URL(value, "https://patentscope.wipo.int")
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== TRUSTED_HOST) return null
    return url.toString()
  } catch { return null }
}

function tagValue(xml: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = xml.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"))
  return match?.[1] ?? null
}

function cleanText(value: string | null) {
  if (!value) return null
  const cdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  const text = decodeEntities(stripMarkup(cdata)).replace(/\s+/g, " ").trim()
  return text || null
}

function stripMarkup(value: string) { return value.replace(/<[^>]+>/g, " ") }
function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
}

function dateOnly(value: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    const iso = value.match(/\b(20\d{2}|19\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
    if (!iso) return null
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`
  }
  return parsed.toISOString().slice(0, 10)
}

function extractPublicationNumber(value: string) {
  const normalized = value.toUpperCase().replace(/\u00a0/g, " ")
  const match = normalized.match(/\b(WO|EP|US|CN|JP|KR|CL|BR|MX|CA|AU|IN|DE|FR|GB)\s*[\/-]?\s*(\d{4,}[A-Z0-9\/-]*)(?:\s*([A-Z]\d?))?\b/)
  if (!match) return null
  return `${match[1]}${match[2].replace(/[\s/-]+/g, "")}${match[3] ?? ""}`.slice(0, 80)
}

function dedupe(items: WipoPatentScopeItem[]) {
  const seen = new Set<string>()
  return items.filter(item => {
    if (seen.has(item.sourceRecordId)) return false
    seen.add(item.sourceRecordId)
    return true
  })
}
