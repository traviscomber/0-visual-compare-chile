import "server-only"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const EPO_BASE = "https://ops.epo.org/3.2"
const TOKEN_URL = `${EPO_BASE}/auth/accesstoken`
const SEARCH_URL = `${EPO_BASE}/rest-services/published-data/search/biblio`
const TIMEOUT_MS = 15_000

let tokenCache: { accessToken: string; expiresAt: number } | null = null

export type EpoFamilySignal = {
  source: "epo_ops"
  sourceRecordId: string
  publication: string
  title: string
  familyMembers: string[]
  jurisdictions: string[]
  url: string
}

export function hasEpoOpsCredentials() {
  return Boolean(readCredential("EPO_OPS_CONSUMER_KEY") && readCredential("EPO_OPS_CONSUMER_SECRET"))
}

export async function searchEpoPatentFamilies(query: string, limit = 5): Promise<EpoFamilySignal[]> {
  if (!hasEpoOpsCredentials()) return []

  const token = await getAccessToken()
  const search = new URL(SEARCH_URL)
  search.searchParams.set("q", `ta=${cqlTerm(query)}`)
  const requested = Math.min(Math.max(Math.trunc(limit), 1), 10)

  const response = await fetchWithRetry(search, {
    cache: "no-store",
    headers: {
      Accept: "application/exchange+xml",
      Authorization: `Bearer ${token}`,
      "User-Agent": "VIDENTIA/1.0",
      "X-OPS-Range": `1-${requested}`,
    },
  }, { attempts: 3, baseDelayMs: 750, timeoutMs: TIMEOUT_MS })

  if (!response.ok) throw new Error(`EPO OPS search respondió ${response.status}`)
  const xml = await response.text()
  const publications = parseBiblioSearch(xml).slice(0, requested)

  const families: EpoFamilySignal[] = []
  for (const item of publications.slice(0, 5)) {
    const familyMembers = await fetchSimpleFamily(item.epodoc, token)
    const members = familyMembers.length ? familyMembers : [item.epodoc]
    families.push({
      source: "epo_ops",
      sourceRecordId: item.epodoc,
      publication: item.epodoc,
      title: item.title || `Global patent family ${item.epodoc}`,
      familyMembers: members,
      jurisdictions: unique(members.map(member => member.slice(0, 2)).filter(value => /^[A-Z]{2}$/.test(value))),
      url: `https://worldwide.espacenet.com/patent/search?q=pn%3D${encodeURIComponent(item.epodoc)}`,
    })
  }

  return families
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken

  const key = readCredential("EPO_OPS_CONSUMER_KEY")
  const secret = readCredential("EPO_OPS_CONSUMER_SECRET")
  if (!key || !secret) throw new Error("EPO OPS credentials are not configured")

  const basic = Buffer.from(`${key}:${secret}`, "utf8").toString("base64")
  const response = await fetchWithRetry(TOKEN_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "VIDENTIA/1.0",
    },
    body: "grant_type=client_credentials",
  }, { attempts: 3, baseDelayMs: 500, timeoutMs: TIMEOUT_MS })

  if (!response.ok) throw new Error(`EPO OPS OAuth respondió ${response.status}`)
  const payload = await response.json() as { access_token?: string; expires_in?: number }
  const accessToken = String(payload.access_token ?? "").trim()
  if (!accessToken) throw new Error("EPO OPS OAuth response did not include an access token")
  const expiresIn = Math.max(120, Number(payload.expires_in ?? 1200))
  tokenCache = { accessToken, expiresAt: Date.now() + expiresIn * 1000 }
  return accessToken
}

async function fetchSimpleFamily(epodoc: string, token: string) {
  const url = `${EPO_BASE}/rest-services/published-data/publication/epodoc/${encodeURIComponent(epodoc)}/equivalents`
  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: {
      Accept: "application/ops+xml",
      Authorization: `Bearer ${token}`,
      "User-Agent": "VIDENTIA/1.0",
    },
  }, { attempts: 3, baseDelayMs: 750, timeoutMs: TIMEOUT_MS })

  if (!response.ok) {
    if (response.status === 404) return []
    throw new Error(`EPO OPS family respondió ${response.status}`)
  }
  return parsePublicationReferences(await response.text())
}

function parseBiblioSearch(xml: string) {
  const results: Array<{ epodoc: string; title: string | null }> = []
  const blockPattern = /<exchange-document\b([^>]*)>([\s\S]*?)<\/exchange-document>/gi
  for (const match of xml.matchAll(blockPattern)) {
    const attrs = match[1] ?? ""
    const body = match[2] ?? ""
    const country = attribute(attrs, "country")
    const docNumber = attribute(attrs, "doc-number")
    const kind = attribute(attrs, "kind")
    if (!country || !docNumber) continue
    const epodoc = `${country}${docNumber}${kind ? `.${kind}` : ""}`
    const title = firstTagText(body, "invention-title")
    results.push({ epodoc, title })
  }
  return dedupeBy(results, item => item.epodoc)
}

function parsePublicationReferences(xml: string) {
  const refs: string[] = []
  const documentPattern = /<document-id\b[^>]*document-id-type=["'](?:docdb|epodoc)["'][^>]*>([\s\S]*?)<\/document-id>/gi
  for (const match of xml.matchAll(documentPattern)) {
    const body = match[1] ?? ""
    const country = firstTagText(body, "country")
    const docNumber = firstTagText(body, "doc-number")
    const kind = firstTagText(body, "kind")
    if (!country || !docNumber) continue
    refs.push(`${country}${docNumber}${kind ? `.${kind}` : ""}`)
  }
  return unique(refs)
}

function cqlTerm(value: string) {
  const normalized = value.replace(/[\u0000-\u001f]/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"').trim()
  if (!normalized) throw new Error("EPO OPS query is empty")
  return `"${normalized.slice(0, 160)}"`
}

function firstTagText(xml: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = xml.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"))
  return match?.[1] ? decodeXml(stripTags(match[1])).trim() || null : null
}

function attribute(attrs: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = attrs.match(new RegExp(`${escaped}=["']([^"']+)["']`, "i"))
  return match?.[1] ? decodeXml(match[1]).trim() || null : null
}

function stripTags(value: string) { return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") }
function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}
function readCredential(name: "EPO_OPS_CONSUMER_KEY" | "EPO_OPS_CONSUMER_SECRET") { return String(process.env[name] ?? "").trim() }
function unique(values: string[]) { return [...new Set(values)] }
function dedupeBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>()
  return values.filter(value => {
    const id = key(value)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}
