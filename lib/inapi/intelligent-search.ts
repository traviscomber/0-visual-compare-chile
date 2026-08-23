import { searchInapi, type InapiMatchMode } from "@/lib/inapi/client"
import type { Marca } from "@/types/marca"

export type TrademarkSearchStrategyKind = "exact" | "contains" | "starts" | "dominant-token"

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
}

const MAX_STRATEGIES = 4
const STOP_WORDS = new Set([
  "DE", "DEL", "LA", "LAS", "EL", "LOS", "Y", "E", "EN", "PARA", "POR", "CON", "SIN",
  "SPA", "S.A", "SA", "LTDA", "LIMITADA", "CHILE", "THE", "AND", "OF",
])

/**
 * Builds a small, explainable search plan instead of exposing INAPI's search-form complexity.
 * The plan is deliberately capped because INAPI lookups are rate-controlled and serialized.
 */
export function buildTrademarkSearchPlan(name: string): TrademarkSearchStrategy[] {
  const normalized = normalize(name)
  if (!normalized) return []

  const strategies: TrademarkSearchStrategy[] = [
    { id: "exact", kind: "exact", label: "Nombre exacto", query: normalized, matchMode: "1" },
    { id: "contains", kind: "contains", label: "Coincidencias que contienen el nombre", query: normalized, matchMode: "2" },
  ]

  const compact = normalized.replace(/[\s-]+/g, "")
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

  // Keep execution sequential. lib/inapi/client already protects the upstream source globally.
  for (const strategy of strategies) {
    try {
      const rows = await searchInapi({ query: strategy.query, type: "nombre", matchMode: strategy.matchMode })
      batches.push(rows)
      completedStrategies.push(strategy)
    } catch (error) {
      failedStrategies.push({
        ...strategy,
        error: error instanceof Error ? error.message : "Consulta no disponible",
      })
    }
  }

  const raw = batches.flat()
  const results = dedupeMarcas(raw)

  return {
    strategies,
    completedStrategies,
    failedStrategies,
    results,
    rawResultCount: raw.length,
    deduplicatedResultCount: results.length,
  }
}

export function rankTrademarkSearchResults(
  execution: TrademarkSearchExecution,
  name: string,
  requestedClasses: Array<string | number>,
): RankedTrademarkResult[] {
  const normalizedQuery = normalize(name)
  const compactQuery = normalizedQuery.replace(/[\s-]+/g, "")
  const dominant = dominantToken(normalizedQuery)
  const classSet = new Set(requestedClasses.map((value) => String(value)))

  return execution.results
    .map((marca) => {
      const normalizedName = normalize(marca.nombre)
      const compactName = normalizedName.replace(/[\s-]+/g, "")
      const active = marca.estado === "Registrada" || marca.estado === "Pendiente"
      const exact = normalizedName === normalizedQuery
      const compactExact = compactName === compactQuery
      const contains = normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)
      const dominantMatch = Boolean(dominant && normalizedName.includes(dominant))
      const classOverlap = marca.niza.filter((code) => classSet.has(String(code))).length

      let score = active ? 35 : 5
      const reasons: string[] = [active ? "antecedente activo" : "antecedente histórico"]

      if (exact) {
        score += 40
        reasons.push("nombre exacto")
      } else if (compactExact) {
        score += 34
        reasons.push("misma denominación sin espacios o guiones")
      } else if (contains) {
        score += 22
        reasons.push("denominación contenida")
      } else if (dominantMatch) {
        score += 14
        reasons.push(`comparte elemento dominante ${dominant}`)
      }

      if (classOverlap > 0) {
        score += Math.min(25, classOverlap * 10)
        reasons.push(`${classOverlap} clase(s) Niza coincidente(s)`)
      }

      return { marca, score: Math.min(100, score), reasons }
    })
    .sort((a, b) => b.score - a.score)
}

function dominantToken(value: string) {
  return value
    .split(/[\s-]+/)
    .map((token) => token.replace(/[^A-Z0-9]/g, ""))
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token))
    .sort((a, b) => b.length - a.length)[0]
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
    if (!existing) {
      byKey.set(key, row)
      continue
    }
    const existingWeight = richness(existing)
    const candidateWeight = richness(row)
    if (candidateWeight > existingWeight) byKey.set(key, row)
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
  return value
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}
