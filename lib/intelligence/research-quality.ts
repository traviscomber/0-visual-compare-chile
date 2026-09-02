import { normalizeStrategicText, type StrategicSearchIntent } from "@/lib/intelligence/search-intent"

export type ResearchProfileContext = {
  country: string | null
  industry: string | null
  offerings: string[]
  capabilities: string[]
  discoveryGoals: string[]
  strategicFocus: string | null
}

export type ResearchQualitySignal = {
  signal_key: string
  source_key: string
  event_type: "patent" | "trademark" | "publication" | "news"
  title: string
  summary: string | null
  occurred_at: string | null
  relevance: "alta" | "media" | "baja"
  payload: Record<string, unknown>
}

export type ResearchSignalKind =
  | "research"
  | "patent"
  | "regulation"
  | "contract"
  | "adoption"
  | "launch"
  | "partnership"
  | "acquisition"
  | "funding"
  | "hiring"
  | "market"
  | "news"

const QUALITY_VERSION = "research-quality-v1"
const NEWS_CLUSTER_THRESHOLD = 0.58
const MAX_CLUSTER_TITLES = 5
const MAX_OUTPUT_SIGNALS = 30

const STOPWORDS = new Set([
  "a", "al", "and", "are", "as", "at", "con", "de", "del", "el", "en", "for", "from", "in", "la", "las", "los", "of", "on", "or", "para", "por", "que", "the", "to", "un", "una", "with", "y",
  "ai", "ia", "artificial", "intelligence", "inteligencia", "technology", "tecnologia", "software", "system", "sistema",
])

const KIND_PATTERNS: Array<{ kind: ResearchSignalKind; pattern: RegExp }> = [
  { kind: "regulation", pattern: /\b(regulat|regulaci[oó]n|reglamento|ley|norma|compliance|cumplimiento|policy|pol[ií]tica)\b/i },
  { kind: "contract", pattern: /\b(contract|contrato|procurement|tender|licitaci[oó]n|adjudic|purchase order|orden de compra)\b/i },
  { kind: "adoption", pattern: /\b(adopt|adopci[oó]n|deploy|desplieg|implement|implementaci[oó]n|customer|cliente|rollout|production use|en producci[oó]n)\b/i },
  { kind: "acquisition", pattern: /\b(acquir|acquisition|adquiere|adquisici[oó]n|compra a|merger|fusi[oó]n)\b/i },
  { kind: "partnership", pattern: /\b(partner|partnership|alianza|acuerdo|collaborat|colaboraci[oó]n)\b/i },
  { kind: "funding", pattern: /\b(funding|raises?\s+\$|financiaci[oó]n|ronda|investment|inversi[oó]n|venture capital)\b/i },
  { kind: "hiring", pattern: /\b(hiring|recruit|contratando|vacante|job opening|empleo|talent|talento)\b/i },
  { kind: "launch", pattern: /\b(launch|lanza|lanzamiento|introduces?|presenta|release|releases|announces?|anuncia|new product|nuevo producto)\b/i },
  { kind: "market", pattern: /\b(market|mercado|revenue|ingresos|growth|crecimiento|forecast|pron[oó]stico|demand|demanda)\b/i },
]

export function normalizeResearchProfile(raw: unknown): ResearchProfileContext | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const row = raw as Record<string, unknown>
  return {
    country: text(row.country),
    industry: text(row.industry),
    offerings: list(row.offerings),
    capabilities: list(row.capabilities),
    discoveryGoals: list(row.discovery_goals),
    strategicFocus: text(row.strategic_focus),
  }
}

export function applyTechnologyResearchQuality<T extends ResearchQualitySignal>(
  signals: T[],
  intent: StrategicSearchIntent,
  profile: ResearchProfileContext | null,
  now = new Date(),
): T[] {
  const scored = signals.flatMap(signal => {
    const result = scoreResearchSignal(signal, intent, profile, now)
    if (!result.keep) return []
    return [{
      ...signal,
      relevance: result.relevance,
      payload: {
        ...signal.payload,
        relevance_score: result.score,
        relevance_factors: result.factors,
        signal_kind: result.kind,
        concept_matches: result.conceptMatches,
        company_fit_matches: result.companyFitMatches,
        quality_version: QUALITY_VERSION,
      },
    } as T]
  })

  const clustered = clusterNews(scored)
  return clustered
    .sort((a, b) => signalScore(b) - signalScore(a) || timestamp(b.occurred_at) - timestamp(a.occurred_at))
    .slice(0, MAX_OUTPUT_SIGNALS)
}

export function scoreResearchSignal(
  signal: ResearchQualitySignal,
  intent: StrategicSearchIntent,
  profile: ResearchProfileContext | null,
  now = new Date(),
) {
  const haystack = normalizeStrategicText(`${signal.title} ${signal.summary ?? ""}`)
  const concept = bestConceptScore(haystack, intent.concept.core)
  const contextMatches = matchingPhrases(haystack, intent.concept.context)
  const exclusionMatches = matchingPhrases(haystack, intent.concept.exclusions)
  const company = companyFit(haystack, intent, profile)
  const kind = classifySignalKind(signal)
  const source = sourceScore(signal.source_key)
  const geography = geographyScore(signal, haystack, profile)
  const event = eventScore(kind)
  const freshness = freshnessScore(signal.occurred_at, now)
  const contextScore = Math.min(12, contextMatches.length * 5)
  const exclusionPenalty = exclusionMatches.length ? 45 : 0
  const raw = concept.score + contextScore + source + company.score + geography + event + freshness - exclusionPenalty
  const score = Math.max(0, Math.min(100, Math.round(raw)))
  const minimum = signal.source_key === "google_news_rss" ? 48 : 42
  const keep = concept.score >= 24 && score >= minimum && !(exclusionMatches.length && concept.score < 42)
  const relevance: ResearchQualitySignal["relevance"] = score >= 75 ? "alta" : score >= 56 ? "media" : "baja"

  return {
    score,
    relevance,
    keep,
    kind,
    conceptMatches: concept.matches,
    companyFitMatches: company.matches,
    factors: {
      concept: concept.score,
      context: contextScore,
      source,
      company_fit: company.score,
      geography,
      event,
      freshness,
      exclusions: exclusionPenalty ? -exclusionPenalty : 0,
    },
  }
}

export function classifySignalKind(signal: Pick<ResearchQualitySignal, "event_type" | "title" | "summary">): ResearchSignalKind {
  if (signal.event_type === "publication") return "research"
  if (signal.event_type === "patent") return "patent"
  const value = `${signal.title} ${signal.summary ?? ""}`
  for (const item of KIND_PATTERNS) if (item.pattern.test(value)) return item.kind
  return "news"
}

function bestConceptScore(haystack: string, values: string[]) {
  let best = 0
  let matches: string[] = []
  for (const raw of values) {
    const phrase = normalizeStrategicText(raw)
    if (!phrase) continue
    const tokens = significantTokens(phrase)
    if (!tokens.length) continue
    const exact = haystack.includes(phrase)
    const evidence = new Set(significantTokens(haystack))
    const matched = tokens.filter(token => evidence.has(token))
    const coverage = matched.length / tokens.length
    const score = exact
      ? 42
      : tokens.length === 1 && coverage === 1
        ? 30
        : matched.length >= 2 && coverage >= 0.75
          ? 38
          : matched.length >= 2 && coverage >= 0.5
            ? 30
            : 0
    if (score > best) {
      best = score
      matches = matched
    }
  }
  return { score: best, matches: unique(matches).slice(0, 8) }
}

function companyFit(haystack: string, intent: StrategicSearchIntent, profile: ResearchProfileContext | null) {
  if (!profile) return { score: 0, matches: [] as string[] }
  const phrases = [profile.industry, ...profile.offerings, ...profile.capabilities].filter((value): value is string => Boolean(value))
  const semanticHaystack = normalizeStrategicText([
    haystack,
    intent.canonicalQuery,
    ...intent.aliases,
    ...intent.concept.core,
    ...intent.concept.context,
  ].join(" "))
  const evidence = new Set(significantTokens(semanticHaystack))
  let score = 0
  const matches: string[] = []

  for (const raw of phrases) {
    const phrase = normalizeStrategicText(raw)
    const tokens = significantTokens(phrase)
    if (!tokens.length) continue
    const exact = phrase.length >= 5 && semanticHaystack.includes(phrase)
    const matched = tokens.filter(token => evidence.has(token))
    if (exact || (matched.length >= 2 && matched.length / tokens.length >= 0.5)) {
      matches.push(raw)
      score += exact ? 6 : 4
    }
    if (score >= 16) break
  }

  return { score: Math.min(16, score), matches: unique(matches).slice(0, 4) }
}

function matchingPhrases(haystack: string, values: string[]) {
  return values.filter(raw => {
    const phrase = normalizeStrategicText(raw)
    if (!phrase) return false
    if (haystack.includes(phrase)) return true
    const tokens = significantTokens(phrase)
    const evidence = new Set(significantTokens(haystack))
    return tokens.length >= 2 && tokens.every(token => evidence.has(token))
  })
}

function sourceScore(source: string) {
  if (source === "inapi_open_data" || source === "epo_ops") return 18
  if (source === "openalex" || source === "crossref") return 15
  if (source === "google_news_rss") return 8
  return 6
}

function geographyScore(signal: ResearchQualitySignal, haystack: string, profile: ResearchProfileContext | null) {
  const scope = typeof signal.payload.search_scope === "string" ? signal.payload.search_scope : ""
  const country = normalizeStrategicText(profile?.country ?? "")
  const chileMention = /\b(chile|chileno|chilena|chilean)\b/.test(haystack)
  if (scope === "chile" && (signal.source_key === "inapi_open_data" || chileMention)) return 8
  if (country === "chile" && chileMention) return 8
  if (scope === "chile") return 4
  return 0
}

function eventScore(kind: ResearchSignalKind) {
  if (["contract", "adoption", "regulation", "acquisition", "partnership", "launch", "funding"].includes(kind)) return 12
  if (kind === "hiring" || kind === "market") return 8
  if (kind === "patent") return 10
  if (kind === "research") return 7
  return 0
}

function freshnessScore(value: string | null, now: Date) {
  if (!value) return 0
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 0
  const days = Math.max(0, (now.getTime() - date.getTime()) / 86_400_000)
  if (days <= 30) return 5
  if (days <= 180) return 3
  if (days <= 365) return 1
  return 0
}

function clusterNews<T extends ResearchQualitySignal>(signals: T[]): T[] {
  const nonNews = signals.filter(signal => signal.event_type !== "news")
  const news = signals.filter(signal => signal.event_type === "news")
  const clusters: T[][] = []

  for (const signal of news) {
    const target = clusters.find(cluster => canCluster(cluster[0], signal))
    if (target) target.push(signal)
    else clusters.push([signal])
  }

  const collapsed = clusters.map(cluster => {
    const sorted = [...cluster].sort((a, b) => signalScore(b) - signalScore(a) || timestamp(b.occurred_at) - timestamp(a.occurred_at))
    const primary = sorted[0]
    if (sorted.length === 1) return primary
    const sources = unique(sorted.map(item => text(item.payload.publisher) ?? item.summary ?? item.source_key)).filter(Boolean)
    return {
      ...primary,
      payload: {
        ...primary.payload,
        cluster_size: sorted.length,
        cluster_sources: sources.slice(0, 8),
        cluster_titles: sorted.map(item => item.title).slice(0, MAX_CLUSTER_TITLES),
        cluster_signal_keys: sorted.map(item => item.signal_key).slice(0, 12),
      },
    } as T
  })

  return [...nonNews, ...collapsed]
}

function canCluster(left: ResearchQualitySignal, right: ResearchQualitySignal) {
  const leftKind = text(left.payload.signal_kind) ?? classifySignalKind(left)
  const rightKind = text(right.payload.signal_kind) ?? classifySignalKind(right)
  if (leftKind !== rightKind) return false
  const a = titleTokens(left.title)
  const b = titleTokens(right.title)
  if (a.size < 3 || b.size < 3) return false
  let intersection = 0
  for (const token of a) if (b.has(token)) intersection += 1
  const union = new Set([...a, ...b]).size
  return union > 0 && intersection / union >= NEWS_CLUSTER_THRESHOLD
}

function titleTokens(value: string) {
  const titleOnly = value.replace(/\s+-\s+[^-]{2,80}$/u, " ")
  return new Set(significantTokens(titleOnly))
}

function significantTokens(value: string) {
  return normalizeStrategicText(value)
    .split(/\s+/)
    .filter(token => token.length >= 3 && !STOPWORDS.has(token))
}

function signalScore(signal: ResearchQualitySignal) {
  const value = Number(signal.payload.relevance_score ?? 0)
  return Number.isFinite(value) ? value : 0
}

function timestamp(value: string | null) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function list(value: unknown) {
  return Array.isArray(value) ? value.flatMap(item => {
    const parsed = text(item)
    return parsed ? [parsed] : []
  }) : []
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}
