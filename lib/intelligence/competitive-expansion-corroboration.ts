import "server-only"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchGoogleNews } from "@/lib/intelligence/google-news"
import { searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { niceClassLabel } from "@/lib/intelligence/nice-class-intelligence"

export const CLASS_EXPANSION_PREFIX = "Expansión competitiva Nice:"

export type CorroborationActivity = "launching" | "hiring" | "integrating" | "commercializing" | "patent" | "research"
export type CorroborationEvidenceState = "supporting_evidence" | "mixed_evidence" | "insufficient_evidence"

export type CorroborationEvidence = {
  source: string
  sourceRecordId: string
  title: string
  date: string | null
  url: string | null
  activity: CorroborationActivity
  directness: "direct" | "indirect"
  matchedTerms: string[]
}

export type ExternalCorroborationResult = {
  evidence: CorroborationEvidence[]
  sourceCoverage: Record<string, { available: boolean; evidence_count: number }>
  queryContext: {
    company: string
    new_nice_classes: number[]
    domain_terms: string[]
    queries: string[]
  }
}

const ACTION_TERMS: Record<Exclude<CorroborationActivity, "patent" | "research">, string[]> = {
  launching: ["launch", "launches", "launched", "lanzamiento", "lanza", "presenta", "debuta", "estrena"],
  hiring: ["hiring", "recruit", "recruiting", "vacancy", "job", "jobs", "contrata", "contratando", "vacante", "vacantes"],
  integrating: ["integrates", "integrating", "integration", "integrates with", "integra", "integrando", "integración", "alianza", "partnership"],
  commercializing: ["commercial", "commercializes", "commercializing", "selling", "sales", "available", "comercializa", "comercializando", "venta", "vende", "disponible"],
}

const DOMAIN_STOPWORDS = new Set([
  "clase", "nice", "servicios", "productos", "artículos", "actividad", "cubierta", "por", "para", "con", "del", "las", "los", "una", "unos", "unas", "y", "e", "de", "en", "a",
])

export function parseExpansionClasses(reason: string) {
  if (!reason.startsWith(CLASS_EXPANSION_PREFIX)) return []
  const match = reason.match(/incorpora por primera vez clase(?:s)? Nice ([0-9, ]+)\./i)
  if (!match?.[1]) return []
  return Array.from(new Set(match[1].split(",").map(value => Number(value.trim())).filter(value => Number.isInteger(value) && value >= 1 && value <= 45)))
    .sort((a, b) => a - b)
}

export function buildDomainTerms(classes: number[]) {
  const terms = classes.flatMap(value => significantTerms(niceClassLabel(value)))
  return Array.from(new Set(terms)).slice(0, 12)
}

export function classifyEvidenceState(evidence: CorroborationEvidence[], sourceCoverage: Record<string, { available: boolean; evidence_count: number }>): CorroborationEvidenceState {
  const direct = evidence.filter(item => item.directness === "direct")
  const independentFamilies = new Set(direct.map(item => sourceFamily(item.source)))
  if (direct.some(item => ["launching", "hiring", "integrating", "commercializing"].includes(item.activity)) && independentFamilies.size >= 1) {
    return independentFamilies.size >= 2 || direct.length >= 2 ? "supporting_evidence" : "mixed_evidence"
  }
  if (evidence.some(item => item.activity === "patent" || item.activity === "research")) return "mixed_evidence"
  const availableCount = Object.values(sourceCoverage).filter(item => item.available).length
  return availableCount > 0 ? "insufficient_evidence" : "insufficient_evidence"
}

export async function gatherExternalExpansionCorroboration(company: string, newNiceClasses: number[], eventDate: string | null): Promise<ExternalCorroborationResult> {
  const domainTerms = buildDomainTerms(newNiceClasses)
  const compactDomain = domainTerms.slice(0, 5).join(" ") || newNiceClasses.map(value => `Nice ${value}`).join(" ")
  const now = new Date()
  const event = eventDate ? new Date(`${eventDate}T12:00:00Z`) : null
  const baseFrom = event && Number.isFinite(event.getTime()) ? new Date(event.getTime() - 90 * 86400000) : new Date(now.getTime() - 180 * 86400000)
  const from = new Date(Math.max(baseFrom.getTime(), now.getTime() - 365 * 86400000))
  const webQuery = `"${sanitizeQuery(company)}" ${compactDomain}`.trim()
  const researchQuery = `${sanitizeQuery(company)} ${compactDomain}`.trim()

  const [news, openalex, crossref] = await Promise.all([
    capture(() => searchGoogleNews(webQuery, from, now, 12, "global")),
    capture(() => searchOpenAlexWorks(researchQuery, from, now, 8)),
    capture(() => searchCrossrefWorks(researchQuery, from, now, 8)),
  ])

  const evidence: CorroborationEvidence[] = []
  if (news.ok) {
    for (const item of news.value) {
      const classified = classifyCommercialTitle(item.title, company, domainTerms)
      if (!classified) continue
      evidence.push({
        source: item.source,
        sourceRecordId: item.sourceRecordId,
        title: item.title,
        date: item.date,
        url: item.url,
        activity: classified.activity,
        directness: "direct",
        matchedTerms: classified.matchedTerms,
      })
    }
  }

  if (openalex.ok) {
    for (const item of openalex.value) {
      const matchedTerms = matchDomainTerms(item.title, domainTerms)
      if (!matchesCompany(item.title, company) || !matchedTerms.length) continue
      evidence.push({ source: item.source, sourceRecordId: item.sourceRecordId, title: item.title, date: item.date, url: item.url, activity: "research", directness: "indirect", matchedTerms })
    }
  }

  if (crossref.ok) {
    for (const item of crossref.value) {
      const matchedTerms = matchDomainTerms(item.title, domainTerms)
      if (!matchesCompany(item.title, company) || !matchedTerms.length) continue
      evidence.push({ source: item.source, sourceRecordId: item.sourceRecordId, title: item.title, date: item.date, url: item.url, activity: "research", directness: "indirect", matchedTerms })
    }
  }

  return {
    evidence: dedupeEvidence(evidence).slice(0, 24),
    sourceCoverage: {
      google_news_rss: { available: news.ok, evidence_count: news.ok ? news.value.length : 0 },
      openalex: { available: openalex.ok, evidence_count: openalex.ok ? openalex.value.length : 0 },
      crossref: { available: crossref.ok, evidence_count: crossref.ok ? crossref.value.length : 0 },
    },
    queryContext: {
      company,
      new_nice_classes: newNiceClasses,
      domain_terms: domainTerms,
      queries: [webQuery, researchQuery],
    },
  }
}

export function classifyCommercialTitle(title: string, company: string, domainTerms: string[]) {
  if (!matchesCompany(title, company)) return null
  const matchedTerms = matchDomainTerms(title, domainTerms)
  if (!matchedTerms.length) return null
  const normalized = normalize(title)
  for (const [activity, terms] of Object.entries(ACTION_TERMS) as Array<[Exclude<CorroborationActivity, "patent" | "research">, string[]]>) {
    if (terms.some(term => normalized.includes(normalize(term)))) return { activity, matchedTerms }
  }
  return null
}

export function matchDomainTerms(text: string, domainTerms: string[]) {
  const normalized = normalize(text)
  return domainTerms.filter(term => normalized.includes(normalize(term))).slice(0, 8)
}

export function matchesCompany(text: string, company: string) {
  const companyTerms = significantTerms(company).filter(term => term.length >= 3)
  if (!companyTerms.length) return false
  const normalized = normalize(text)
  const required = companyTerms.length === 1 ? 1 : Math.min(2, companyTerms.length)
  return companyTerms.filter(term => normalized.includes(term)).length >= required
}

function significantTerms(value: string) {
  return normalize(value).split(/[^a-z0-9]+/).filter(term => term.length >= 3 && !DOMAIN_STOPWORDS.has(term))
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function sanitizeQuery(value: string) {
  return value.replace(/[\u0000-\u001f"']/g, " ").replace(/\s+/g, " ").trim()
}

function sourceFamily(source: string) {
  if (source === "google_news_rss") return "web"
  if (source === "openalex" || source === "crossref") return "research"
  if (source.includes("patent") || source.includes("epo") || source.includes("inapi")) return "patent"
  return source
}

function dedupeEvidence(rows: CorroborationEvidence[]) {
  const seen = new Set<string>()
  return rows.filter(item => {
    const key = `${sourceFamily(item.source)}:${normalize(item.title)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function capture<T>(operation: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; value: T extends Array<unknown> ? [] : never }> {
  try {
    return { ok: true, value: await operation() }
  } catch (error) {
    console.warn("[competitive-expansion-corroboration] source unavailable", error)
    return { ok: false, value: [] as T extends Array<unknown> ? [] : never }
  }
}
