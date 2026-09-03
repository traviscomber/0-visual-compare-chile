import "server-only"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const EPO_BASE = "https://ops.epo.org/3.2"
const TOKEN_URL = `${EPO_BASE}/auth/accesstoken`
const SEARCH_URL = `${EPO_BASE}/rest-services/published-data/search/biblio`
const TIMEOUT_MS = 15_000

let tokenCache: { accessToken: string; expiresAt: number } | null = null

export type EpoLegalEvent = {
  jurisdiction: string | null
  code: string
  description: string | null
  date: string | null
}

export type EpoPriorityClaim = {
  country: string
  number: string
  kind: string | null
  date: string | null
}

export type EpoPrioritySearchClaim = {
  country: string | null
  number: string
  date: string | null
}

export type EpoEvidenceCoverage = {
  family: "family_endpoint" | "equivalents_fallback" | "source_not_found" | "unavailable"
  priorities: "family_endpoint" | "source_not_found" | "unavailable"
  citations: "family_endpoint" | "source_not_found" | "unavailable"
  legalEvents: "family_endpoint" | "source_not_found" | "unavailable"
}

export type EpoFamilySignal = {
  source: "epo_ops"
  sourceRecordId: string
  publication: string
  title: string
  familyMembers: string[]
  jurisdictions: string[]
  priorityClaims: EpoPriorityClaim[]
  citations: string[]
  legalEvents: EpoLegalEvent[]
  evidenceCoverage: EpoEvidenceCoverage
  retrievedAt: string
  url: string
}

type SearchPublication = { epodoc: string; title: string | null }

export function hasEpoOpsCredentials() {
  return Boolean(readCredential("EPO_OPS_CONSUMER_KEY") && readCredential("EPO_OPS_CONSUMER_SECRET"))
}

export async function searchEpoPatentFamilies(query: string, limit = 5): Promise<EpoFamilySignal[]> {
  if (!hasEpoOpsCredentials()) return []
  const token = await getAccessToken()
  const requested = normalizeSearchLimit(limit)
  const publications = await searchEpoPublications(`ta=${cqlTerm(query)}`, requested, token)
  return hydrateFamilies(publications.slice(0, requested), token)
}

export async function searchEpoPatentFamiliesForReview(
  query: string,
  priorityClaims: EpoPrioritySearchClaim[],
  limit = 3,
): Promise<EpoFamilySignal[]> {
  if (!hasEpoOpsCredentials()) return []

  const token = await getAccessToken()
  const requested = normalizeSearchLimit(limit)
  const publications: SearchPublication[] = []
  const priorityTerms = buildPrioritySearchTerms(priorityClaims).slice(0, 10)

  if (priorityTerms.length) {
    publications.push(...await searchEpoPublications(`pr any ${cqlTerm(priorityTerms.join(" "))}`, requested, token))
  }

  const uniquePriorityResults = dedupeBy(publications, item => item.epodoc)
  if (uniquePriorityResults.length < requested) {
    publications.push(...await searchEpoPublications(`ta=${cqlTerm(query)}`, requested, token))
  }

  return hydrateFamilies(dedupeBy(publications, item => item.epodoc).slice(0, requested), token)
}

async function searchEpoPublications(cql: string, requested: number, token: string): Promise<SearchPublication[]> {
  const search = new URL(SEARCH_URL)
  search.searchParams.set("q", cql)

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
  return parseBiblioSearch(await response.text()).slice(0, requested)
}

async function hydrateFamilies(publications: SearchPublication[], token: string): Promise<EpoFamilySignal[]> {
  const families: EpoFamilySignal[] = []

  for (const item of publications) {
    let evidence: FamilyEvidence
    try {
      evidence = await fetchFamilyEvidence(item.epodoc, token)
    } catch (error) {
      console.warn("[epo-ops] family evidence degraded", item.epodoc, error instanceof Error ? error.message : String(error))
      try {
        const familyMembers = await fetchSimpleFamily(item.epodoc, token)
        evidence = {
          familyMembers,
          priorityClaims: [],
          citations: [],
          legalEvents: [],
          evidenceCoverage: {
            family: "equivalents_fallback",
            priorities: "unavailable",
            citations: "unavailable",
            legalEvents: "unavailable",
          },
        }
      } catch {
        evidence = {
          familyMembers: [],
          priorityClaims: [],
          citations: [],
          legalEvents: [],
          evidenceCoverage: {
            family: "unavailable",
            priorities: "unavailable",
            citations: "unavailable",
            legalEvents: "unavailable",
          },
        }
      }
    }

    const members = unique([item.epodoc, ...evidence.familyMembers])
    families.push({
      source: "epo_ops",
      sourceRecordId: item.epodoc,
      publication: item.epodoc,
      title: item.title || `Global patent family ${item.epodoc}`,
      familyMembers: members,
      jurisdictions: unique(members.map(member => member.slice(0, 2)).filter(value => /^[A-Z]{2}$/.test(value))),
      priorityClaims: evidence.priorityClaims.slice(0, 30),
      citations: evidence.citations.filter(citation => !members.includes(citation)).slice(0, 20),
      legalEvents: evidence.legalEvents.slice(0, 20),
      evidenceCoverage: evidence.evidenceCoverage,
      retrievedAt: new Date().toISOString(),
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

type FamilyEvidence = {
  familyMembers: string[]
  priorityClaims: EpoPriorityClaim[]
  citations: string[]
  legalEvents: EpoLegalEvent[]
  evidenceCoverage: EpoEvidenceCoverage
}

async function fetchFamilyEvidence(epodoc: string, token: string): Promise<FamilyEvidence> {
  const docdb = toDocdbReference(epodoc)
  const url = `${EPO_BASE}/rest-services/family/publication/docdb/${encodeURIComponent(docdb)}/biblio,legal`
  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: {
      Accept: "application/ops+xml",
      Authorization: `Bearer ${token}`,
      "User-Agent": "VIDENTIA/1.0",
    },
  }, { attempts: 3, baseDelayMs: 750, timeoutMs: TIMEOUT_MS })

  if (!response.ok) {
    if (response.status === 404) {
      return {
        familyMembers: [],
        priorityClaims: [],
        citations: [],
        legalEvents: [],
        evidenceCoverage: {
          family: "source_not_found",
          priorities: "source_not_found",
          citations: "source_not_found",
          legalEvents: "source_not_found",
        },
      }
    }
    throw new Error(`EPO OPS family evidence respondió ${response.status}`)
  }

  const xml = await response.text()
  return {
    familyMembers: parseFamilyMembers(xml),
    priorityClaims: parsePriorityClaims(xml),
    citations: parseCitations(xml),
    legalEvents: parseLegalEvents(xml),
    evidenceCoverage: {
      family: "family_endpoint",
      priorities: "family_endpoint",
      citations: "family_endpoint",
      legalEvents: "family_endpoint",
    },
  }
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

function parseFamilyMembers(xml: string) {
  const members: string[] = []
  for (const block of tagBlocks(xml, "ops:family-member")) {
    const publication = firstBlock(block, "publication-reference")
    if (!publication) continue
    const [reference] = parsePublicationReferences(publication)
    if (reference) members.push(reference)
  }
  return unique(members)
}

function parsePriorityClaims(xml: string): EpoPriorityClaim[] {
  const claims: EpoPriorityClaim[] = []
  for (const block of tagBlocks(xml, "priority-claim")) {
    const documentIds = tagBlocks(block, "document-id")
    const document = documentIds.find(item => /document-id-type=["']docdb["']/i.test(item)) ?? documentIds[0]
    if (!document) continue
    const country = firstTagText(document, "country")?.toUpperCase()
    const number = firstTagText(document, "doc-number")
    if (!country || !number) continue
    claims.push({
      country,
      number,
      kind: firstTagText(document, "kind"),
      date: normalizeDate(firstTagText(document, "date")),
    })
  }
  return dedupeBy(claims, claim => `${claim.country}:${claim.number}:${claim.kind ?? ""}:${claim.date ?? ""}`)
}

function parseCitations(xml: string) {
  const citations: string[] = []
  for (const block of tagBlocks(xml, "references-cited")) citations.push(...parsePublicationReferences(block))
  return unique(citations)
}

function parseLegalEvents(xml: string): EpoLegalEvent[] {
  const events: EpoLegalEvent[] = []
  const legalPattern = /<ops:legal\b([^>]*)>([\s\S]*?)<\/ops:legal>/gi
  for (const match of xml.matchAll(legalPattern)) {
    const attrs = match[1] ?? ""
    const body = match[2] ?? ""
    const code = attribute(attrs, "code")
    if (!code) continue
    events.push({
      jurisdiction: firstTagText(body, "ops:L001EP"),
      code,
      description: attribute(attrs, "desc"),
      date: normalizeDate(firstTagText(body, "ops:L007EP")),
    })
  }
  return dedupeBy(events, event => `${event.jurisdiction ?? ""}:${event.code}:${event.date ?? ""}:${event.description ?? ""}`)
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

function buildPrioritySearchTerms(claims: EpoPrioritySearchClaim[]) {
  const terms: string[] = []
  for (const claim of claims) {
    const country = claim.country?.trim().toUpperCase() ?? ""
    if (!/^[A-Z]{2}$/.test(country)) continue
    const normalized = claim.number.toUpperCase().replace(/[^A-Z0-9]/g, "")
    if (!normalized) continue

    terms.push(`${country}${normalized}`)

    const year = claim.date?.match(/^(\d{4})-/)?.[1] ?? null
    if (!year || normalized.includes(year)) continue
    const shortYear = year.slice(2)
    if (normalized.startsWith(shortYear) && normalized.length > 2) terms.push(`${country}${year}${normalized.slice(2)}`)
    else terms.push(`${country}${year}${normalized}`)
  }
  return unique(terms).slice(0, 10)
}

function normalizeSearchLimit(limit: number) {
  return Math.min(Math.max(Math.trunc(limit), 1), 5)
}

function toDocdbReference(epodoc: string) {
  const normalized = epodoc.trim().toUpperCase()
  const match = normalized.match(/^([A-Z]{2})([A-Z0-9]+?)(?:\.([A-Z][A-Z0-9]?))?$/)
  if (!match) throw new Error(`Unsupported EPO publication reference: ${epodoc}`)
  return `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ""}`
}

function cqlTerm(value: string) {
  const normalized = value.replace(/[\u0000-\u001f]/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"').trim()
  if (!normalized) throw new Error("EPO OPS query is empty")
  return `"${normalized.slice(0, 320)}"`
}

function tagBlocks(xml: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const optionalPrefix = tag.includes(":") ? escaped : `(?:[A-Za-z0-9_-]+:)?${escaped}`
  const pattern = new RegExp(`<${optionalPrefix}\\b[^>]*>[\\s\\S]*?<\\/${optionalPrefix}>`, "gi")
  return [...xml.matchAll(pattern)].map(match => match[0])
}

function firstBlock(xml: string, tag: string) {
  return tagBlocks(xml, tag)[0] ?? null
}

function firstTagText(xml: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const optionalPrefix = tag.includes(":") ? escaped : `(?:[A-Za-z0-9_-]+:)?${escaped}`
  const match = xml.match(new RegExp(`<${optionalPrefix}\\b[^>]*>([\\s\\S]*?)<\\/${optionalPrefix}>`, "i"))
  return match?.[1] ? decodeXml(stripTags(match[1])).trim() || null : null
}

function attribute(attrs: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = attrs.match(new RegExp(`${escaped}=["']([^"']+)["']`, "i"))
  return match?.[1] ? decodeXml(match[1]).trim() || null : null
}

function normalizeDate(value: string | null) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  return value
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