import { searchInapi, type InapiMatchMode } from "@/lib/inapi/client"
import { searchTrademarkIntelligenceIndex } from "@/lib/trademark/intelligence-index"
import type { Marca } from "@/types/marca"

export type TrademarkSearchStrategyKind = "exact" | "contains" | "starts" | "dominant-token" | "phonetic"

export interface TrademarkSearchStrategy {
  id: string
  kind: TrademarkSearchStrategyKind
  label: string
  query: string
  matchMode: InapiMatchMode
}

export interface TrademarkSearchExecution {
  strategies: TrademarkSearchStrategy[]
  completedStrategies: TrademarkSearchStrategy[]
  failedStrategies: Array<TrademarkSearchStrategy & { error: string }>
  results: Marca[]
  rawResultCount: number
  deduplicatedResultCount: number
  discovery?: { source: "n3uralia-index"; candidates: number }
  verification?: { source: "inapi-live"; strategies: number; rows: number }
}

export interface RankedTrademarkResult {
  marca: Marca
  score: number
  reasons: string[]
  denominativeSimilarity: number
  phoneticSimilarity: number
}

const MAX_STRATEGIES = 4
const MAX_LIVE_VERIFICATION_STRATEGIES = 2
const STOP_WORDS = new Set([
  "DE", "DEL", "LA", "LAS", "EL", "LOS", "Y", "E", "EN", "PARA", "POR", "CON", "SIN",
  "SPA", "S.A", "SA", "LTDA", "LIMITADA", "CHILE", "THE", "AND", "OF",
])

export function buildTrademarkSearchPlan(name: string): TrademarkSearchStrategy[] {
  const normalized = normalize(name)
  if (!normalized) return []

  const strategies: TrademarkSearchStrategy[] = [
    { id: "exact", kind: "exact", label: "Nombre exacto", query: normalized, matchMode: "1" },
    { id: "contains", kind: "contains", label: "Coincidencias que contienen el nombre", query: normalized, matchMode: "2" },
  ]

  const compact = compactComparable(normalized)
  if (compact.length >= 5 && compact !== normalized) {
    strategies.push({ id: "compact", kind: "contains", label: "Variante sin espacios ni guiones", query: compact, matchMode: "2" })
  }

  const dominant = dominantToken(normalized)
  if (dominant && dominant !== normalized && dominant.length >= 5) {
    strategies.push({ id: `token:${dominant}`, kind: "dominant-token", label: `Elemento dominante: ${dominant}`, query: dominant, matchMode: "2" })
  }

  if (strategies.length < MAX_STRATEGIES && normalized.length >= 6) {
    strategies.push({ id: "starts", kind: "starts", label: "Nombres que comienzan igual", query: normalized, matchMode: "3" })
  }

  return dedupeStrategies(strategies).slice(0, MAX_STRATEGIES)
}

/**
 * Hybrid search: the synchronized N3uralia Intelligence index discovers broad
 * candidates in one local RPC. INAPI live verifies the strongest textual
 * strategies. Callers may lower the live verification count for latency-sensitive
 * previews while the full product keeps the default two live checks.
 */
export async function searchTrademarkIntelligently(
  name: string,
  requestedClasses: Array<string | number> = [],
  liveVerificationLimit = MAX_LIVE_VERIFICATION_STRATEGIES,
): Promise<TrademarkSearchExecution> {
  const strategies = buildTrademarkSearchPlan(name)
  const safeLiveLimit = Math.max(0, Math.min(MAX_LIVE_VERIFICATION_STRATEGIES, Math.floor(liveVerificationLimit)))
  const verificationPlan = strategies.slice(0, safeLiveLimit)

  const indexPromise: Promise<Marca[]> = searchTrademarkIntelligenceIndex(name, requestedClasses, 50)
    .then((index) => index.rows)
    .catch((error) => {
      console.warn("[trademark-search] local index unavailable", error instanceof Error ? error.message : String(error))
      return []
    })

  const verificationPromise = Promise.all(verificationPlan.map(async (strategy) => {
    try {
      const rows = await searchInapi({ query: strategy.query, type: "nombre", matchMode: strategy.matchMode })
      return {
        strategy,
        rows: rows.map((row) => ({
          ...row,
          metadata: { ...(row.metadata ?? {}), discoverySource: "inapi-live" },
        })),
        error: null as string | null,
      }
    } catch (error) {
      return {
        strategy,
        rows: [] as Marca[],
        error: error instanceof Error ? error.message : "Consulta no disponible",
      }
    }
  }))

  const [indexRows, verificationResults] = await Promise.all([indexPromise, verificationPromise])
  const completedStrategies: TrademarkSearchStrategy[] = []
  const failedStrategies: Array<TrademarkSearchStrategy & { error: string }> = []
  const liveBatches: Marca[][] = []

  for (const result of verificationResults) {
    if (result.error) {
      failedStrategies.push({ ...result.strategy, error: result.error })
      continue
    }
    completedStrategies.push(result.strategy)
    liveBatches.push(result.rows)
  }

  const live = liveBatches.flat()
  const raw = [...live, ...indexRows]
  const results = dedupeMarcas(raw)

  return {
    strategies,
    completedStrategies,
    failedStrategies,
    results,
    rawResultCount: raw.length,
    deduplicatedResultCount: results.length,
    discovery: { source: "n3uralia-index", candidates: indexRows.length },
    verification: { source: "inapi-live", strategies: completedStrategies.length, rows: live.length },
  }
}

export function rankTrademarkSearchResults(
  execution: TrademarkSearchExecution,
  name: string,
  requestedClasses: Array<string | number>,
): RankedTrademarkResult[] {
  const normalizedQuery = normalize(name)
  const compactQuery = compactComparable(normalizedQuery)
  const queryPhonetic = phoneticKey(normalizedQuery)
  const dominant = dominantToken(normalizedQuery)
  const classSet = new Set(requestedClasses.map(String))

  return execution.results
    .map((marca) => {
      const normalizedName = normalize(marca.nombre)
      const compactName = compactComparable(normalizedName)
      const active = marca.estado === "Registrada" || marca.estado === "Pendiente"
      const exact = normalizedName === normalizedQuery
      const compactExact = compactName === compactQuery
      const contains = normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)
      const dominantMatch = Boolean(dominant && normalizedName.includes(dominant))
      const classOverlap = marca.niza.filter((code) => classSet.has(String(code))).length
      const denominative = denominativeSimilarityBreakdown(normalizedQuery, normalizedName)
      const denominativeSimilarity = denominative.score
      const phoneticSimilarity = similarityPercent(queryPhonetic, phoneticKey(normalizedName))
      const liveVerified = marca.metadata?.discoverySource === "inapi-live"

      let score = active ? 35 : 5
      const reasons: string[] = [active ? "antecedente activo" : "antecedente histórico"]
      if (liveVerified) reasons.push("verificado en consulta INAPI live")
      else reasons.push("descubierto en índice N3uralia Intelligence")

      if (exact) { score += 40; reasons.push("nombre exacto") }
      else if (compactExact) { score += 34; reasons.push("misma denominación sin espacios o guiones") }
      else if (contains) { score += 22; reasons.push("denominación contenida") }
      else if (denominativeSimilarity >= 84) { score += 20; reasons.push(`similitud denominativa ${denominativeSimilarity}%`) }
      else if (phoneticSimilarity >= 86) { score += 17; reasons.push(`similitud fonética ${phoneticSimilarity}%`) }
      else if (dominantMatch) { score += 14; reasons.push(`comparte elemento dominante ${dominant}`) }

      if (!exact && !compactExact && denominativeSimilarity >= 72 && denominativeSimilarity < 84) {
        score += 8
        reasons.push(`semejanza denominativa compuesta ${denominativeSimilarity}%`)
      }
      if (!exact && denominative.prefix >= 80) { score += 4; reasons.push("inicio denominativo muy similar") }
      if (!exact && denominative.token >= 80 && denominative.queryTokens > 1) { score += 5; reasons.push("alta coincidencia entre palabras distintivas") }
      if (!exact && phoneticSimilarity >= 74 && phoneticSimilarity < 86) { score += 6; reasons.push(`proximidad fonética ${phoneticSimilarity}%`) }
      if (classOverlap > 0) { score += Math.min(25, classOverlap * 10); reasons.push(`${classOverlap} clase(s) Niza coincidente(s)`) }
      if (liveVerified) score += 3

      return { marca, score: Math.min(100, score), reasons, denominativeSimilarity, phoneticSimilarity }
    })
    .sort((a, b) => b.score - a.score || b.denominativeSimilarity - a.denominativeSimilarity || b.phoneticSimilarity - a.phoneticSimilarity)
}

function dominantToken(value: string) {
  return value.split(/[\s-]+/).map((token) => token.replace(/[^A-Z0-9]/g, "")).filter((token) => token.length >= 4 && !STOP_WORDS.has(token)).sort((a, b) => b.length - a.length)[0]
}

function dedupeStrategies(strategies: TrademarkSearchStrategy[]) {
  const seen = new Set<string>()
  return strategies.filter((strategy) => {
    const key = `${strategy.matchMode}:${strategy.query}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function dedupeMarcas(rows: Marca[]) {
  const byKey = new Map<string, Marca>()
  for (const row of rows) {
    const key = trademarkKey(row)
    const existing = byKey.get(key)
    if (!existing) { byKey.set(key, row); continue }
    const rowLive = row.metadata?.discoverySource === "inapi-live"
    const existingLive = existing.metadata?.discoverySource === "inapi-live"
    if (rowLive && !existingLive) byKey.set(key, mergeRecord(row, existing))
    else if (!rowLive && existingLive) byKey.set(key, mergeRecord(existing, row))
    else if (richness(row) > richness(existing)) byKey.set(key, mergeRecord(row, existing))
  }
  return [...byKey.values()]
}

function mergeRecord(primary: Marca, fallback: Marca): Marca {
  return {
    ...fallback,
    ...primary,
    niza: primary.niza.length ? primary.niza : fallback.niza,
    viena: primary.viena.length ? primary.viena : fallback.viena,
    imagenUrl: primary.imagenUrl || fallback.imagenUrl,
    metadata: { ...(fallback.metadata ?? {}), ...(primary.metadata ?? {}) },
  }
}

function trademarkKey(row: Marca) {
  const request = String(row.metadata?.numSolicitud ?? "").trim()
  const registration = String(row.numeroRegistro ?? "").trim()
  if (request) return `sol:${request}`
  if (registration) return `reg:${registration}`
  return `fallback:${normalize(row.nombre)}:${normalize(row.solicitante ?? "")}:${[...row.niza].sort().join(",")}`
}

function richness(row: Marca) {
  return (row.numeroRegistro ? 3 : 0) + (row.metadata?.numSolicitud ? 3 : 0) + row.niza.length + row.viena.length + (row.imagenUrl ? 3 : 0) + (row.solicitante ? 1 : 0)
}

function normalize(value: string) {
  return value.trim().toUpperCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ")
}

function compactComparable(value: string) {
  return normalize(value).replace(/[^A-Z0-9]/g, "")
}

function phoneticKey(value: string) {
  return compactComparable(value)
    .replace(/^H/, "")
    .replace(/PH/g, "F")
    .replace(/LL/g, "Y")
    .replace(/CH/g, "X")
    .replace(/QU/g, "K")
    .replace(/GU(?=[EI])/g, "G")
    .replace(/[CQ]/g, "K")
    .replace(/V/g, "B")
    .replace(/Z/g, "S")
    .replace(/Y/g, "I")
    .replace(/GE|GI/g, "JE")
    .replace(/CE|CI/g, "SE")
    .replace(/(.)\1+/g, "$1")
}

function denominativeSimilarityBreakdown(query: string, candidate: string) {
  const a = compactComparable(query)
  const b = compactComparable(candidate)
  const edit = similarityPercent(a, b)
  const jaro = Math.round(jaroWinkler(a, b) * 100)
  const token = tokenSimilarity(query, candidate)
  const prefix = prefixSimilarity(a, b)
  const containment = a && b && (a.includes(b) || b.includes(a)) ? Math.round((Math.min(a.length, b.length) / Math.max(a.length, b.length)) * 100) : 0
  const queryTokens = meaningfulTokens(query).length
  const weighted = edit * 0.38 + jaro * 0.32 + token * 0.20 + prefix * 0.10
  const score = Math.round(Math.max(weighted, containment * 0.92))
  return { score: Math.min(100, score), edit, jaro, token, prefix, queryTokens }
}

function meaningfulTokens(value: string) {
  return normalize(value).split(/[\s-]+/).map((token) => token.replace(/[^A-Z0-9]/g, "")).filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
}

function tokenSimilarity(a: string, b: string) {
  const left = meaningfulTokens(a)
  const right = meaningfulTokens(b)
  if (!left.length || !right.length) return 0
  const forward = left.reduce((sum, token) => sum + Math.max(...right.map((candidate) => similarityPercent(token, candidate))), 0) / left.length
  const reverse = right.reduce((sum, token) => sum + Math.max(...left.map((candidate) => similarityPercent(token, candidate))), 0) / right.length
  return Math.round((forward + reverse) / 2)
}

function prefixSimilarity(a: string, b: string) {
  if (!a || !b) return 0
  const limit = Math.min(6, a.length, b.length)
  let shared = 0
  while (shared < limit && a[shared] === b[shared]) shared += 1
  return Math.round((shared / limit) * 100)
}

function jaroWinkler(a: string, b: string) {
  if (a === b) return 1
  if (!a || !b) return 0
  const range = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1)
  const aMatches = new Array(a.length).fill(false)
  const bMatches = new Array(b.length).fill(false)
  let matches = 0
  for (let i = 0; i < a.length; i += 1) {
    const start = Math.max(0, i - range)
    const end = Math.min(i + range + 1, b.length)
    for (let j = start; j < end; j += 1) {
      if (bMatches[j] || a[i] !== b[j]) continue
      aMatches[i] = true; bMatches[j] = true; matches += 1; break
    }
  }
  if (!matches) return 0
  const aMatched: string[] = []
  const bMatched: string[] = []
  for (let i = 0; i < a.length; i += 1) if (aMatches[i]) aMatched.push(a[i])
  for (let i = 0; i < b.length; i += 1) if (bMatches[i]) bMatched.push(b[i])
  let transpositions = 0
  for (let i = 0; i < aMatched.length; i += 1) if (aMatched[i] !== bMatched[i]) transpositions += 1
  transpositions /= 2
  const jaro = (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3
  let prefix = 0
  while (prefix < Math.min(4, a.length, b.length) && a[prefix] === b[prefix]) prefix += 1
  return jaro + prefix * 0.1 * (1 - jaro)
}

function similarityPercent(a: string, b: string) {
  if (!a || !b) return 0
  if (a === b) return 100
  const distance = levenshtein(a, b)
  return Math.max(0, Math.round((1 - distance / Math.max(a.length, b.length)) * 100))
}

function levenshtein(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0]
    previous[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j]
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return previous[b.length]
}