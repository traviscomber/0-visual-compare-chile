export type StrategicSearchScope = "chile" | "global" | "both"

export type StrategicConceptBlocks = {
  core: string[]
  context: string[]
  exclusions: string[]
}

export type StrategicSearchIntent = {
  canonicalQuery: string
  conceptKey: string
  scope: StrategicSearchScope
  aliases: string[]
  chileQueries: string[]
  globalQueries: string[]
  concept: StrategicConceptBlocks
}

const MAX_VARIANTS = 6
const MAX_CONCEPT_TERMS = 10

const EXACT_BILINGUAL_PATTERNS: Array<{
  test: RegExp
  es: string
  en: string
  core: string[]
  context?: string[]
  exclusions?: string[]
}> = [
  {
    test: /\benterprise\s+(?:ai|artificial intelligence)\s+agents?\b/i,
    es: "agentes de IA empresariales",
    en: "enterprise AI agents",
    core: ["enterprise AI agents", "agentes de IA empresariales", "artificial intelligence agents", "agentic AI", "IA agéntica", "autonomous AI agents"],
    context: ["enterprise", "business", "workflow", "operations", "empresarial", "negocio", "flujos de trabajo", "operaciones"],
    exclusions: ["agent-based model", "modelo basado en agentes", "multi-agent reinforcement learning"],
  },
  {
    test: /\bagentes?\s+de\s+(?:ia|inteligencia artificial)\s+empresarial(?:es)?\b/i,
    es: "agentes de IA empresariales",
    en: "enterprise AI agents",
    core: ["enterprise AI agents", "agentes de IA empresariales", "artificial intelligence agents", "agentic AI", "IA agéntica", "autonomous AI agents"],
    context: ["enterprise", "business", "workflow", "operations", "empresarial", "negocio", "flujos de trabajo", "operaciones"],
    exclusions: ["agent-based model", "modelo basado en agentes", "multi-agent reinforcement learning"],
  },
  {
    test: /\b(?:ai|artificial intelligence)\s+workflow\s+automation\s+enterprise\b/i,
    es: "automatización de flujos de trabajo empresariales con IA",
    en: "enterprise AI workflow automation",
    core: ["enterprise AI workflow automation", "automatización de flujos de trabajo empresariales con IA", "AI workflow automation", "agentic workflow", "flujos agénticos", "intelligent workflow automation"],
    context: ["enterprise", "business", "operations", "process", "empresarial", "negocio", "operaciones", "procesos"],
    exclusions: ["laboratory automation", "automatización de laboratorio"],
  },
  {
    test: /\benterprise\s+(?:ai|artificial intelligence)\s+workflow\s+automation\b/i,
    es: "automatización de flujos de trabajo empresariales con IA",
    en: "enterprise AI workflow automation",
    core: ["enterprise AI workflow automation", "automatización de flujos de trabajo empresariales con IA", "AI workflow automation", "agentic workflow", "flujos agénticos", "intelligent workflow automation"],
    context: ["enterprise", "business", "operations", "process", "empresarial", "negocio", "operaciones", "procesos"],
    exclusions: ["laboratory automation", "automatización de laboratorio"],
  },
  {
    test: /\bautomatizaci[oó]n\s+de\s+flujos?\s+de\s+trabajo.*\b(?:ia|inteligencia artificial)\b/i,
    es: "automatización de flujos de trabajo empresariales con IA",
    en: "enterprise AI workflow automation",
    core: ["enterprise AI workflow automation", "automatización de flujos de trabajo empresariales con IA", "AI workflow automation", "agentic workflow", "flujos agénticos", "intelligent workflow automation"],
    context: ["enterprise", "business", "operations", "process", "empresarial", "negocio", "operaciones", "procesos"],
    exclusions: ["laboratory automation", "automatización de laboratorio"],
  },
  {
    test: /\boperational\s+intelligence.*\b(?:ai|artificial intelligence)\b/i,
    es: "software de inteligencia operacional con IA",
    en: "operational intelligence AI software",
    core: ["operational intelligence AI", "software de inteligencia operacional con IA", "operational intelligence software", "AI operations software", "decision intelligence software", "software de inteligencia de decisiones"],
    context: ["enterprise", "operations", "workflow", "decision", "empresarial", "operaciones", "flujos de trabajo", "decisión"],
    exclusions: ["emotional intelligence", "inteligencia emocional", "military intelligence", "inteligencia militar"],
  },
  {
    test: /\binteligencia\s+oper(?:acional|ativa).*\b(?:ia|inteligencia artificial)\b/i,
    es: "software de inteligencia operacional con IA",
    en: "operational intelligence AI software",
    core: ["operational intelligence AI", "software de inteligencia operacional con IA", "operational intelligence software", "AI operations software", "decision intelligence software", "software de inteligencia de decisiones"],
    context: ["enterprise", "operations", "workflow", "decision", "empresarial", "operaciones", "flujos de trabajo", "decisión"],
    exclusions: ["emotional intelligence", "inteligencia emocional", "military intelligence", "inteligencia militar"],
  },
  {
    test: /\bmachine\s+learning\b/i,
    es: "aprendizaje automático",
    en: "machine learning",
    core: ["machine learning", "aprendizaje automático"],
  },
  {
    test: /\baprendizaje\s+autom[aá]tico\b/i,
    es: "aprendizaje automático",
    en: "machine learning",
    core: ["machine learning", "aprendizaje automático"],
  },
  {
    test: /\bartificial\s+intelligence\b/i,
    es: "inteligencia artificial",
    en: "artificial intelligence",
    core: ["artificial intelligence", "inteligencia artificial", "AI", "IA"],
  },
  {
    test: /\binteligencia\s+artificial\b/i,
    es: "inteligencia artificial",
    en: "artificial intelligence",
    core: ["artificial intelligence", "inteligencia artificial", "AI", "IA"],
  },
]

export function buildStrategicSearchIntent(
  query: string,
  scope: StrategicSearchScope = "both",
  storedAliases: string[] = [],
): StrategicSearchIntent {
  const canonicalQuery = cleanQuery(query)
  const exact = EXACT_BILINGUAL_PATTERNS.find(pattern => pattern.test.test(canonicalQuery))
  const canonicalLooksSpanish = looksSpanish(canonicalQuery)

  const es = exact
    ? unique([
        exact.es,
        ...storedAliases.filter(looksSpanish),
        canonicalLooksSpanish ? canonicalQuery : undefined,
      ]).slice(0, MAX_VARIANTS)
    : unique([
        toSpanishVariant(canonicalQuery),
        ...storedAliases.filter(looksSpanish),
        canonicalLooksSpanish ? canonicalQuery : undefined,
      ]).slice(0, MAX_VARIANTS)

  const en = exact
    ? unique([
        exact.en,
        ...storedAliases.filter(value => !looksSpanish(value)),
        canonicalLooksSpanish ? undefined : canonicalQuery,
      ]).slice(0, MAX_VARIANTS)
    : unique([
        toEnglishVariant(canonicalQuery),
        ...storedAliases.filter(value => !looksSpanish(value)),
        canonicalLooksSpanish ? undefined : canonicalQuery,
      ]).slice(0, MAX_VARIANTS)

  const aliases = unique([...es, ...en])
    .filter(value => normalizeForComparison(value) !== normalizeForComparison(canonicalQuery))
    .slice(0, MAX_VARIANTS)
  const concept = exact
    ? {
        core: unique(exact.core).slice(0, MAX_CONCEPT_TERMS),
        context: unique(exact.context ?? []).slice(0, MAX_CONCEPT_TERMS),
        exclusions: unique(exact.exclusions ?? []).slice(0, MAX_CONCEPT_TERMS),
      }
    : buildFallbackConcept(canonicalQuery, aliases)
  const globalCanonical = exact?.en ?? en[0] ?? canonicalQuery

  return {
    canonicalQuery,
    conceptKey: normalizeForComparison(globalCanonical),
    scope,
    aliases,
    chileQueries: es.length ? es : [canonicalQuery],
    globalQueries: en.length ? en : [canonicalQuery],
    concept,
  }
}

export function strategicSearchMetadata(query: string, scope: StrategicSearchScope) {
  const intent = buildStrategicSearchIntent(query, scope)
  return {
    search_scope: scope,
    query_aliases: intent.aliases,
    normalization_version: "search-intent-v2",
    semantic_key: intent.conceptKey,
  }
}

export function mergeStrategicSearchMetadata(metadata: unknown, query: string, scope: StrategicSearchScope) {
  const previous = metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {}
  return { ...previous, ...strategicSearchMetadata(query, scope) }
}

export function strategicSemanticKey(query: string) {
  return buildStrategicSearchIntent(query, "both").conceptKey
}

export function readStrategicSearchScope(metadata: unknown): StrategicSearchScope {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "both"
  const value = (metadata as Record<string, unknown>).search_scope
  return value === "chile" || value === "global" || value === "both" ? value : "both"
}

export function readStrategicQueryAliases(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return []
  const aliases = (metadata as Record<string, unknown>).query_aliases
  return Array.isArray(aliases)
    ? aliases.filter((value): value is string => typeof value === "string" && value.trim().length >= 2).slice(0, MAX_VARIANTS)
    : []
}

function buildFallbackConcept(canonicalQuery: string, aliases: string[]): StrategicConceptBlocks {
  const candidates = unique([canonicalQuery, ...aliases]).slice(0, 4)
  return {
    core: candidates.length ? candidates : [canonicalQuery],
    context: [],
    exclusions: [],
  }
}

function toSpanishVariant(query: string) {
  const value = query
    .replace(/\bartificial intelligence\b/gi, "inteligencia artificial")
    .replace(/\bAI\b/g, "IA")
    .replace(/\benterprise\b/gi, "empresarial")
    .replace(/\bagents?\b/gi, "agentes")
    .replace(/\bworkflow automation\b/gi, "automatización de flujos de trabajo")
    .replace(/\boperational intelligence\b/gi, "inteligencia operacional")
    .replace(/\bmachine learning\b/gi, "aprendizaje automático")
  return cleanQuery(value)
}

function toEnglishVariant(query: string) {
  const value = query
    .replace(/\binteligencia artificial\b/gi, "artificial intelligence")
    .replace(/\bIA\b/g, "AI")
    .replace(/\bempresarial(?:es)?\b/gi, "enterprise")
    .replace(/\bagentes?\b/gi, "agents")
    .replace(/\bautomatizaci[oó]n de flujos? de trabajo\b/gi, "workflow automation")
    .replace(/\binteligencia oper(?:acional|ativa)\b/gi, "operational intelligence")
    .replace(/\baprendizaje autom[aá]tico\b/gi, "machine learning")
  return cleanQuery(value)
}

function looksSpanish(value: string) {
  const normalized = normalizeForComparison(value)
  return /\b(ia|inteligencia|agentes|automatizacion|flujos|trabajo|empresarial|operacional|operativa|aprendizaje)\b/.test(normalized)
}

function cleanQuery(value: string) {
  return value.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
}

function unique(values: Array<string | undefined>) {
  const seen = new Set<string>()
  const output: string[] = []
  for (const raw of values) {
    const value = raw ? cleanQuery(raw) : ""
    if (!value) continue
    const key = normalizeForComparison(value)
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }
  return output
}

export function normalizeStrategicText(value: string) {
  return normalizeForComparison(value)
}

function normalizeForComparison(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}
