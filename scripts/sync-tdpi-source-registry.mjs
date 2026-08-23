import { Client } from "pg"
import { loadProductionEnv } from "./production-env.mjs"

const SOURCES = [
  { type: "boletin", url: "https://www.tdpi.cl/category/documentos/boletin-de-jurisprudencia-marcaria/" },
  { type: "ingreso", url: "https://www.tdpi.cl/category/documentos/ingresos/" },
  { type: "estado_diario", url: "https://www.tdpi.cl/category/documentos/estados-diarios/" },
]

loadProductionEnv()
if (!process.env.POSTGRES_URL) throw new Error("Missing POSTGRES_URL")

const client = new Client({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } })
await client.connect()

try {
  let discovered = 0
  for (const source of SOURCES) {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "N3uralia-Intelligence/1.0 (+https://www.n3uralia.com)" },
      cache: "no-store",
    })
    if (!response.ok) throw new Error(`TDPI ${source.type} index returned HTTP ${response.status}`)
    const html = await response.text()
    const entries = discoverLinks(html, source.url, source.type)
    for (const entry of entries) {
      const result = await client.query(
        `insert into public.intelligence_source_documents
           (source, document_type, source_url, title, published_on, metadata)
         values ('tdpi', $1, $2, $3, $4, $5::jsonb)
         on conflict (source, source_url) do update set
           title = coalesce(excluded.title, intelligence_source_documents.title),
           published_on = coalesce(excluded.published_on, intelligence_source_documents.published_on),
           updated_at = now()
         returning (xmax = 0) as inserted`,
        [source.type, entry.url, entry.title, entry.publishedOn, JSON.stringify({ index_url: source.url })],
      )
      if (result.rows[0]?.inserted) discovered += 1
    }
  }
  console.log(JSON.stringify({ ok: true, newly_discovered: discovered }))
} finally {
  await client.end().catch(() => undefined)
}

function discoverLinks(html, baseUrl, type) {
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  const seen = new Set()
  const rows = []
  for (const match of anchors) {
    let href = decodeHtml(match[1] ?? "").trim()
    const title = stripTags(decodeHtml(match[2] ?? "")).replace(/\s+/g, " ").trim()
    if (!href || !title) continue
    try { href = new URL(href, baseUrl).toString() } catch { continue }
    if (!href.startsWith("https://www.tdpi.cl/")) continue
    if (!looksRelevant(type, href, title)) continue
    if (seen.has(href)) continue
    seen.add(href)
    rows.push({ url: href, title, publishedOn: dateFromText(`${title} ${href}`) })
  }
  return rows
}

function looksRelevant(type, href, title) {
  const haystack = `${href} ${title}`.toLowerCase()
  if (type === "boletin") return haystack.includes("bolet") && (haystack.includes("marca") || href.toLowerCase().endsWith(".pdf"))
  if (type === "ingreso") return /(?:^|\W)in[- ]?\d{1,2}[- ]?\d{1,2}[- ]?20\d{2}/i.test(title) || haystack.includes("/ingresos/")
  return haystack.includes("ed-") || haystack.includes("estado") || haystack.includes("estados-diarios")
}

function dateFromText(value) {
  const match = value.match(/(\d{1,2})[-_/](\d{1,2})[-_/](20\d{2})/)
  if (!match) return null
  const [, d, m, y] = match
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function stripTags(value) { return value.replace(/<[^>]+>/g, " ") }
function decodeHtml(value) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
}
