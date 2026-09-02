export type StrategicSearchScope = "chile" | "global" | "both"

export type StrategicSearchIntent = {
  canonicalQuery: string
  scope: StrategicSearchScope
  aliases: string[]
  chileQueries: string[]
  globalQueries: string[]
}

const MAX_VARIANTS = 6

const EXACT_BILINGUAL_PATTERNS: Array<{ test: RegExp; es: string; en: string }> = [
  { test: /\benterprise\s+(?:ai|artificial intelligence)\s+agents?\b/i, es: "agentes de IA empresariales", en: "enterprise AI agents" },
  { test: /\bagentes?\s+de\s+(?:ia|inteligencia artificial)\s+empresarial(?:es)?\b/i, es: "agentes de IA empresariales", en: "enterprise AI agents" },
  { test: /\b(?:ai|artificial intelligence)\s+workflow\s+automation\s+enterprise\b/i, es: "automatización de flujos de trabajo empresariales con IA", en: "enterprise AI workflow automation" },
  { test: /\benterprise\s+(?:ai|artificial intelligence)\s+workflow\s+automation\b/i, es: "automatización de flujos de trabajo empresariales con IA", en: "enterprise AI workflow automation" },
  { test: /\bautomatizaci[oó]n\s+de\s+flujos?\s+de\s+trabajo.*\b(?:ia|inteligencia artificial)\b/i, es: "automatización de flujos de trabajo empresariales con IA", en: "enterprise AI workflow automation" },
  { test: /\boperational\s+intelligence.*\b(?:ai|artificial intelligence)\b/i, es: "software de inteligencia operacional con IA", en: "operational intelligence AI software" },
  { test: /\binteligencia\s+oper(?:acional|ativa).*\b(?:ia|inteligencia artificial)\b/i, es: "software de inteligencia operacional con IA", en: "operational intelligence AI software" },
  { test: /\bmachine\s+learning\b/i, es: "aprendizaje automático", en: "machine learning" },
  { test: /\baprendizaje\s+autom[aá]tico\b/i, es: "aprendizaje automático", en: "machine learning" },
  { test: /\bartificial\s+intelligence\b/i, es: "inteligencia artificial", en: "artificial intelligence" },
  { test: /\binteligencia\s+artificial\b/i, es: "inteligencia artificial", en: "artificial intelligence" },
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

  return {
    canonicalQuery,
    scope,
    aliases: unique([...es, ...en]).filter(value => normalizeForComparison(value) !== normalizeForComparison(canonicalQuery)).slice(0, MAX_VARIANTS),
    chileQueries: es.length ? es : [canonicalQuery],
    globalQueries: en.length ? en : [canonicalQuery],
  }
}

export function strategicSearchMetadata(query: string, scope: StrategicSearchScope) {
  const intent = buildStrategicSearchIntent(query, scope)
  return {
    search_scope: scope,
    query_aliases: intent.aliases,
    normalization_version: "bilingual-es-en-v2",
    semantic_key: strategicSemanticKey(query),
  }
}

export function mergeStrategicSearchMetadata(metadata: unknown, query: string, scope: StrategicSearchScope) {
  const previous = metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {}
  return { ...previous, ...strategicSearchMetadata(query, scope) }
}

export function strategicSemanticKey(query: string) {
  const intent = buildStrategicSearchIntent(query, "both")
  const canonical = intent.globalQueries[0] ?? intent.chileQueries[0] ?? intent.canonicalQuery
  return normalizeForComparison(canonical)
}

export function readStrategicSearchScope(metadata: unknown): StrategicSearchScope {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "both"
  const value = (metadata as Record<string, unknown>).search_scope
  return value === "chile" || value === "global" || value === "both" ? value : "both"
}

export function readStrategicQueryAliases(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return []
  const aliases = (metadata as Record<string, unknown>).query_aliases
  return Array.isArray(aliases) ? aliases.filter((value): value is string => typeof value === "string" && value.trim().length >= 2).slice(0, MAX_VARIANTS) : []
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

function normalizeForComparison(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}
