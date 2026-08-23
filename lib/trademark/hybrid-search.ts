import { searchInapi } from "@/lib/inapi/client"
import {
  buildTrademarkSearchPlan,
  type TrademarkSearchExecution,
  type TrademarkSearchStrategy,
} from "@/lib/inapi/intelligent-search"
import { searchTrademarkIntelligenceIndex } from "@/lib/trademark/intelligence-index"
import type { Marca } from "@/types/marca"

export interface HybridTrademarkSearchExecution extends TrademarkSearchExecution {
  discovery: {
    source: "n3uralia-index"
    candidates: number
  }
  verification: {
    source: "inapi-live"
    strategies: number
    rows: number
  }
}

const MAX_LIVE_VERIFICATION_STRATEGIES = 2

export async function searchTrademarkHybrid(
  name: string,
  requestedClasses: Array<string | number> = [],
): Promise<HybridTrademarkSearchExecution> {
  const plan = buildTrademarkSearchPlan(name)
  const index = await searchTrademarkIntelligenceIndex(name, requestedClasses, 50)

  const verificationPlan = prioritizeVerificationStrategies(plan).slice(0, MAX_LIVE_VERIFICATION_STRATEGIES)
  const completedStrategies: TrademarkSearchStrategy[] = []
  const failedStrategies: Array<TrademarkSearchStrategy & { error: string }> = []
  const liveBatches: Marca[][] = []

  for (const strategy of verificationPlan) {
    try {
      const rows = await searchInapi({ query: strategy.query, type: "nombre", matchMode: strategy.matchMode })
      liveBatches.push(rows.map((row) => ({
        ...row,
        metadata: { ...(row.metadata ?? {}), discoverySource: "inapi-live" },
      })))
      completedStrategies.push(strategy)
    } catch (error) {
      failedStrategies.push({
        ...strategy,
        error: error instanceof Error ? error.message : "Consulta no disponible",
      })
    }
  }

  const liveRows = liveBatches.flat()
  const merged = dedupePreferLive([...liveRows, ...index.rows])

  return {
    strategies: plan,
    completedStrategies,
    failedStrategies,
    results: merged,
    rawResultCount: index.rawCount + liveRows.length,
    deduplicatedResultCount: merged.length,
    discovery: { source: "n3uralia-index", candidates: index.rawCount },
    verification: {
      source: "inapi-live",
      strategies: completedStrategies.length,
      rows: liveRows.length,
    },
  }
}

function prioritizeVerificationStrategies(strategies: TrademarkSearchStrategy[]) {
  const priority = new Map<string, number>([["exact", 0], ["contains", 1], ["starts", 2], ["dominant-token", 3]])
  return [...strategies].sort((a, b) => (priority.get(a.kind) ?? 9) - (priority.get(b.kind) ?? 9))
}

function dedupePreferLive(rows: Marca[]) {
  const byKey = new Map<string, Marca>()
  for (const row of rows) {
    const key = trademarkKey(row)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, row)
      continue
    }

    const rowIsLive = row.metadata?.discoverySource === "inapi-live"
    const existingIsLive = existing.metadata?.discoverySource === "inapi-live"
    if (rowIsLive && !existingIsLive) {
      byKey.set(key, mergeRecord(row, existing))
    } else if (!rowIsLive && existingIsLive) {
      byKey.set(key, mergeRecord(existing, row))
    } else if (richness(row) > richness(existing)) {
      byKey.set(key, mergeRecord(row, existing))
    }
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
  return `name:${normalize(row.nombre)}:${normalize(row.solicitante ?? "")}`
}

function richness(row: Marca) {
  return (row.numeroRegistro ? 3 : 0)
    + (row.metadata?.numSolicitud ? 3 : 0)
    + row.niza.length
    + row.viena.length
    + (row.imagenUrl ? 3 : 0)
    + (row.solicitante ? 1 : 0)
}

function normalize(value: string) {
  return value.trim().toUpperCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ")
}
