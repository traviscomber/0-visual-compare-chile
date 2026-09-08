type RepoActivity = {
  status?: string
  observedAt?: string
  scopeActivity?: Array<{ scope?: string; count?: number }>
  recentCommits?: Array<{ message?: string }>
}

export type ProductResearchTopic = {
  key: string
  label: string
  searchPhrase: string
  anchors: string[]
  source: "github_scope" | "github_commit" | "fallback"
  activityWeight: number
}

type TopicDefinition = {
  label: string
  searchPhrase: string
  aliases: string[]
}

const TOPICS: Record<string, TopicDefinition> = {
  orchard: { label: "Orchard", searchPhrase: "orchard farm operations crop planning", aliases: ["orchard", "farm", "crop", "field operations"] },
  nursery: { label: "Nursery", searchPhrase: "plant nursery propagation scheduling", aliases: ["nursery", "propagation", "seedling", "seedlings"] },
  harvest: { label: "Harvest", searchPhrase: "harvest planning crop yield operations", aliases: ["harvest", "harvesting", "yield"] },
  booking: { label: "Booking", searchPhrase: "booking reservation scheduling operations", aliases: ["booking", "bookings", "reservation", "reservations"] },
  scheduling: { label: "Scheduling", searchPhrase: "operational scheduling optimization", aliases: ["scheduling", "schedule", "calendar", "agenda"] },
  maintenance: { label: "Maintenance", searchPhrase: "predictive maintenance work order operations", aliases: ["maintenance", "maint", "work order", "work orders"] },
  geology: { label: "Geology", searchPhrase: "mining geology geological decision support", aliases: ["geology", "geological", "drilling", "drillhole"] },
  inventory: { label: "Inventory", searchPhrase: "inventory optimization operations", aliases: ["inventory", "stock", "warehouse"] },
  quality: { label: "Quality", searchPhrase: "quality inspection computer vision operations", aliases: ["quality", "inspection", "defect", "defects"] },
  production: { label: "Production", searchPhrase: "production planning operations optimization", aliases: ["production", "manufacturing", "processing"] },
  traceability: { label: "Traceability", searchPhrase: "traceability supply chain operations", aliases: ["traceability", "traceable", "provenance"] },
  procurement: { label: "Procurement", searchPhrase: "procurement purchasing supply operations", aliases: ["procurement", "purchasing", "supplier", "suppliers"] },
  sales: { label: "Sales", searchPhrase: "sales operations demand planning", aliases: ["sales", "commercial", "revenue"] },
  logistics: { label: "Logistics", searchPhrase: "logistics routing operations optimization", aliases: ["logistics", "delivery", "routing", "dispatch"] },
  compliance: { label: "Compliance", searchPhrase: "regulatory compliance evidence workflow", aliases: ["compliance", "regulatory", "regulation"] },
  audit: { label: "Audit", searchPhrase: "audit evidence assurance workflow", aliases: ["audit", "auditing", "assurance"] },
  fleet: { label: "Fleet", searchPhrase: "fleet management telematics operations", aliases: ["fleet", "vehicle", "vehicles", "telematics"] },
  valuation: { label: "Valuation", searchPhrase: "real estate valuation automated valuation", aliases: ["valuation", "appraisal", "comparables", "comps"] },
  crm: { label: "CRM", searchPhrase: "customer relationship management sales workflow", aliases: ["crm", "customer relationship", "lead", "leads"] },
  sensors: { label: "Sensors / IoT", searchPhrase: "sensor IoT operational monitoring", aliases: ["sensor", "sensors", "iot", "telemetry"] },
  "digital-twin": { label: "Digital twin", searchPhrase: "digital twin operational decision support", aliases: ["digital twin", "digital-twin", "twin"] },
  capacity: { label: "Capacity", searchPhrase: "capacity planning operations optimization", aliases: ["capacity", "workload"] },
}

const FALLBACK_TOPICS: Record<string, string[]> = {
  "black-swan": ["orchard", "nursery", "harvest"],
  motil: ["maintenance", "geology", "inventory"],
  pescamar: ["quality", "traceability", "production"],
  kumplio: ["compliance", "audit", "scheduling"],
  chileflota: ["fleet", "maintenance", "scheduling"],
  "property-partners": ["valuation", "crm", "booking"],
}

const NOISE_SCOPES = new Set([
  "api", "auth", "ci", "build", "deps", "dependency", "dependencies", "docs", "documentation",
  "lint", "qa", "test", "tests", "types", "type", "ui", "ux", "style", "styles", "refactor",
  "chore", "security", "data", "database", "migration", "migrations", "mobile", "web", "release",
  "asana", "vercel", "supabase", "github",
])

export function deriveProductResearchTopics(productKey: string, repoActivity: unknown, limit = 3): ProductResearchTopic[] {
  const activity = isRecord(repoActivity) ? repoActivity as RepoActivity : null
  const ranked = new Map<string, ProductResearchTopic>()

  for (const item of activity?.scopeActivity ?? []) {
    const scope = normalizeText(item.scope)
    const count = finitePositive(item.count)
    if (!scope || !count) continue
    const matched = matchKnownTopic(scope)
    if (matched) {
      upsert(ranked, matched.key, matched.definition, "github_scope", count * 4)
      continue
    }
    const dynamic = dynamicTopicFromScope(scope)
    if (dynamic) upsertDynamic(ranked, dynamic, "github_scope", count * 2)
  }

  for (const commit of activity?.recentCommits ?? []) {
    const message = normalizeText(commit.message)
    if (!message) continue
    for (const [key, definition] of Object.entries(TOPICS)) {
      if (!definition.aliases.some(alias => containsPhrase(message, alias))) continue
      upsert(ranked, key, definition, "github_commit", 3)
    }
  }

  const fallback = FALLBACK_TOPICS[productKey] ?? []
  for (const key of fallback) {
    const definition = TOPICS[key]
    if (definition) upsert(ranked, key, definition, "fallback", 1)
  }

  return [...ranked.values()]
    .sort((a, b) => b.activityWeight - a.activityWeight || sourceRank(a.source) - sourceRank(b.source) || a.label.localeCompare(b.label))
    .slice(0, Math.max(1, Math.min(limit, 5)))
}

export function productResearchDomain(productKey: string) {
  const domains: Record<string, { query: string; anchors: string[] }> = {
    "black-swan": { query: "agriculture farm crop horticulture", anchors: ["agriculture", "agricultural", "farm", "crop", "orchard", "horticulture"] },
    motil: { query: "mining mine mineral geology maintenance", anchors: ["mining", "mine", "mineral", "geology", "geological"] },
    pescamar: { query: "seafood aquaculture fish marine processing", anchors: ["seafood", "aquaculture", "aquatic", "fish", "salmon", "marine"] },
    kumplio: { query: "regulatory compliance governance audit", anchors: ["compliance", "regulatory", "regulation", "policy", "audit", "governance"] },
    chileflota: { query: "fleet vehicle transportation telematics", anchors: ["fleet", "vehicle", "automotive", "telematics", "transportation"] },
    "property-partners": { query: "real estate property valuation housing", anchors: ["real estate", "property", "valuation", "housing", "housing market"] },
  }
  return domains[productKey] ?? null
}

export const SUBSECTION_TECHNOLOGY_ANCHORS = [
  "ai", "agentic", "artificial intelligence", "machine learning", "computer vision", "automation",
  "autonomous", "digital twin", "decision support", "optimization", "predictive", "large language model", "llm",
]

function upsert(map: Map<string, ProductResearchTopic>, key: string, definition: TopicDefinition, source: ProductResearchTopic["source"], weight: number) {
  const existing = map.get(key)
  const next: ProductResearchTopic = {
    key,
    label: definition.label,
    searchPhrase: definition.searchPhrase,
    anchors: unique(definition.aliases.map(normalizeText).filter(Boolean)),
    source: chooseSource(existing?.source, source),
    activityWeight: (existing?.activityWeight ?? 0) + weight,
  }
  map.set(key, next)
}

function upsertDynamic(map: Map<string, ProductResearchTopic>, topic: ProductResearchTopic, source: ProductResearchTopic["source"], weight: number) {
  const existing = map.get(topic.key)
  map.set(topic.key, {
    ...topic,
    source: chooseSource(existing?.source, source),
    activityWeight: (existing?.activityWeight ?? 0) + weight,
  })
}

function dynamicTopicFromScope(scope: string): ProductResearchTopic | null {
  const clean = scope.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
  if (!clean || clean.length < 3 || clean.length > 48) return null
  if (NOISE_SCOPES.has(clean)) return null
  if (!/[a-z]/i.test(clean)) return null
  const tokens = clean.split(" ").filter(token => token.length >= 3 && !NOISE_SCOPES.has(token))
  if (!tokens.length) return null
  return {
    key: clean.replace(/\s+/g, "-").slice(0, 48),
    label: clean.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
    searchPhrase: clean,
    anchors: unique([clean, ...tokens]),
    source: "github_scope",
    activityWeight: 0,
  }
}

function matchKnownTopic(value: string) {
  for (const [key, definition] of Object.entries(TOPICS)) {
    if (definition.aliases.some(alias => containsPhrase(value, alias))) return { key, definition }
  }
  return null
}

function chooseSource(current: ProductResearchTopic["source"] | undefined, incoming: ProductResearchTopic["source"]) {
  if (!current) return incoming
  return sourceRank(incoming) < sourceRank(current) ? incoming : current
}

function sourceRank(value: ProductResearchTopic["source"]) {
  return value === "github_scope" ? 0 : value === "github_commit" ? 1 : 2
}

function containsPhrase(value: string, phrase: string) {
  const haystack = ` ${normalizeText(value)} `
  const needle = ` ${normalizeText(phrase)} `
  return haystack.includes(needle)
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim() : ""
}
function finitePositive(value: unknown) { return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0 }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function unique(values: string[]) { return [...new Set(values)] }
