import { searchInapi, type InapiMatchMode } from "@/lib/inapi/client"
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
}

export interface RankedTrademarkResult {
  marca: Marca
  score: number
  reasons: string[]
  denominativeSimilarity: number
  phoneticSimilarity: number
}

const MAX_STRATEGIES = 4
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

export async function searchTrademarkIntelligently(name: string): Promise<TrademarkSearchExecution> {
  const strategies = buildTrademarkSearchPlan(name)
  const completedStrategies: TrademarkSearchStrategy[] = []
  const failedStrategies: Array<TrademarkSearchStrategy & { error: string }> = []
  const batches: Marca[][] = []

  for (const strategy of strategies) {
    try {
      const rows = await searchInapi({ query: strategy.query, type: "nombre", matchMode: strategy.matchMode })
      batches.push(rows)
      completedStrategies.push(strategy)
    } catch (error) {
      failedStrategies.push({ ...strategy, error: error instanceof Error ? error.message : "Consulta no disponible" })
    }
  }

  const raw = batches.flat()
  const results = dedupeMarcas(raw)
  return { strategies, completedStrategies, failedStrategies, results, rawResultCount: raw.length, deduplicatedResultCount: results.length }
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
  const classSet = new Set(requestedClasses.map((value) => String(value)))

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
      const denominativeSimilarity = similarityPercent(compactQuery, compactName)
      const phoneticSimilarity = similarityPercent(queryPhonetic, phoneticKey(normalizedName))

      let score = active ? 35 : 5
      const reasons: string[] = [active ? "antecedente activo" : "antecedente histórico"]

      if (exact) { score += 40; reasons.push("nombre exacto") }
      else if (compactExact) { score += 34; reasons.push("misma denominación sin espacios o guiones") }
      else if (contains) { score += 22; reasons.push("denominación contenida") }
      else if (denominativeSimilarity >= 84) { score += 20; reasons.push(`similitud denominativa ${denominativeSimilarity}%`) }
      else if (phoneticSimilarity >= 86) { score += 17; reasons.push(`similitud fonética ${phoneticSimilarity}%`) }
      else if (dominantMatch) { score += 14; reasons.push(`comparte elemento dominante ${dominant}`) }

      if (!exact && !compactExact && denominativeSimilarity >= 72 && denominativeSimilarity < 84) {
        score += 8
        reasons.push(`semejanza ortográfica ${denominativeSimilarity}%`)
      }
      if (!exact && phoneticSimilarity >= 74 && phoneticSimilarity < 86) {
        score += 6
        reasons.push(`proximidad fonética ${phoneticSimilarity}%`)
      }
      if (classOverlap > 0) {
        score += Math.min(25, classOverlap * 10)
        reasons.push(`${classOverlap} clase(s) Niza coincidente(s)`)
      }

      return { marca, score: Math.min(100, score), reasons, denominativeSimilarity, phoneticSimilarity }
    })
    .sort((a, b) => b.score - a.score || b.phoneticSimilarity - a.phoneticSimilarity)
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
    if (!existing || richness(row) > richness(existing)) byKey.set(key, row)
  }
  return [...byKey.values()]
}

function trademarkKey(row: Marca) {
  const request = String(row.metadata?.numSolicitud ?? "").trim()
  const registration = String(row.numeroRegistro ?? "").trim()
  if (request) return `sol:${request}`
  if (registration) return `reg:${registration}`
  return `fallback:${normalize(row.nombre)}:${normalize(row.solicitante ?? "")}:${[...row.niza].sort().join(",")}`
}

function richness(row: Marca) {
  return (row.numeroRegistro ? 3 : 0) + (row.metadata?.numSolicitud ? 3 : 0) + row.niza.length + (row.solicitante ? 1 : 0)
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
