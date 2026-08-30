import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isPortfolioGap, scoreRecommendation } from "@/lib/intelligence/competitive-rules"

const WINDOW_DAYS = 360
const MARKET_WINDOW_DAYS = 180

type IdentityRow = {
  id: string
  canonical_name: string
  country: string | null
  resolution_confidence: number | string
}

type ActivityRow = {
  identity_id: string
  entity_type: string
  filing_date: string | null
  classification_codes: string[] | null
}

type Aggregate = {
  count: number
  quarters: Set<number>
}

type MarketStatRow = {
  code: string
  current_filings: number | string
  previous_filings: number | string
  current_companies: number | string
  previous_companies: number | string
  entrant_companies: number | string
  experimental_companies: number | string
}

export type PortfolioGapItem = {
  code: string
  asset_type: "patent" | "trademark"
  classification: "IPC" | "Niza"
  own_filings: number
  competitor_filings: number
  competitor_active_quarters: number
  market: {
    current_filings: number
    previous_filings: number
    current_companies: number
    previous_companies: number
    entrant_companies: number
    experimental_companies: number
  }
}

export type PortfolioRecommendation = PortfolioGapItem & {
  score: ReturnType<typeof scoreRecommendation>
  headline: string
  action: string
  evidence: string[]
  guardrail: string
}

export async function buildPortfolioGap(
  admin: SupabaseClient,
  ownIdentityId: string,
  competitorIdentityId: string,
) {
  if (ownIdentityId === competitorIdentityId) throw new Error("La empresa propia y el competidor deben ser distintos.")

  const cutoff = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  const [identityResult, activityResult] = await Promise.all([
    admin
      .from("intelligence_company_identities")
      .select("id,canonical_name,country,resolution_confidence")
      .in("id", [ownIdentityId, competitorIdentityId]),
    admin
      .from("intelligence_company_ip_activity")
      .select("identity_id,entity_type,filing_date,classification_codes")
      .in("identity_id", [ownIdentityId, competitorIdentityId])
      .gte("filing_date", cutoff)
      .order("filing_date", { ascending: false })
      .limit(8000),
  ])

  if (identityResult.error) throw new Error(`No pudimos cargar las identidades: ${identityResult.error.message}`)
  if (activityResult.error) throw new Error(`No pudimos comparar los portafolios: ${activityResult.error.message}`)

  const identities = (identityResult.data ?? []) as IdentityRow[]
  const own = identities.find(item => item.id === ownIdentityId)
  const competitor = identities.find(item => item.id === competitorIdentityId)
  if (!own || !competitor) throw new Error("No pudimos resolver una de las identidades seleccionadas.")

  const activity = (activityResult.data ?? []) as ActivityRow[]
  const ownMap = aggregateActivity(activity.filter(item => item.identity_id === ownIdentityId))
  const competitorMap = aggregateActivity(activity.filter(item => item.identity_id === competitorIdentityId))

  const strictGaps: PortfolioGapItem[] = []
  const experimentalOnly: PortfolioGapItem[] = []
  const overlaps: PortfolioGapItem[] = []
  const ownOnly: PortfolioGapItem[] = []

  for (const [key, competitorAggregate] of competitorMap) {
    const [assetTypeRaw, code] = splitKey(key)
    const assetType = assetTypeRaw === "patent" ? "patent" : "trademark"
    const ownAggregate = ownMap.get(key) ?? { count: 0, quarters: new Set<number>() }
    const item = emptyGapItem(assetType, code, ownAggregate, competitorAggregate)
    if (isPortfolioGap(ownAggregate.count, competitorAggregate.count)) strictGaps.push(item)
    else if (ownAggregate.count === 0 && competitorAggregate.count === 1) experimentalOnly.push(item)
    else if (ownAggregate.count > 0) overlaps.push(item)
  }

  for (const [key, ownAggregate] of ownMap) {
    if (competitorMap.has(key)) continue
    const [assetTypeRaw, code] = splitKey(key)
    const assetType = assetTypeRaw === "patent" ? "patent" : "trademark"
    ownOnly.push(emptyGapItem(assetType, code, ownAggregate, { count: 0, quarters: new Set<number>() }))
  }

  strictGaps.sort(gapSort)
  experimentalOnly.sort(gapSort)
  overlaps.sort(gapSort)
  ownOnly.sort((a, b) => b.own_filings - a.own_filings || a.code.localeCompare(b.code))

  const marketStats = await loadMarketStats(admin, strictGaps.slice(0, 40))
  const hydratedGaps = strictGaps.map(item => ({ ...item, market: marketStats.get(`${item.asset_type}:${item.code}`) ?? item.market }))
  const recommendations = hydratedGaps.slice(0, 16).map(buildRecommendation).sort((a, b) => b.score.total - a.score.total)

  return {
    generated_at: new Date().toISOString(),
    window_days: WINDOW_DAYS,
    own: toIdentity(own),
    competitor: toIdentity(competitor),
    metrics: {
      patent_gaps: hydratedGaps.filter(item => item.asset_type === "patent").length,
      trademark_gaps: hydratedGaps.filter(item => item.asset_type === "trademark").length,
      overlaps: overlaps.length,
      experimental_only: experimentalOnly.length,
      high_recommendations: recommendations.filter(item => item.score.tier === "alta").length,
    },
    gaps: {
      patent: hydratedGaps.filter(item => item.asset_type === "patent").slice(0, 12),
      trademark: hydratedGaps.filter(item => item.asset_type === "trademark").slice(0, 12),
    },
    experimental_only: experimentalOnly.slice(0, 12),
    overlaps: overlaps.slice(0, 12),
    own_only: ownOnly.slice(0, 12),
    recommendations,
    methodology: {
      gap: "Brecha = el competidor tiene al menos 2 expedientes en la clasificación durante 360 días y la empresa propia tiene 0.",
      experimental: "Una única presentación del competidor se mantiene como señal experimental y no genera una brecha estratégica por sí sola.",
      score: "Prioridad 0–100 = materialidad (25) + novedad (20) + convergencia de mercado (20) + persistencia trimestral (20) + proximidad de clasificación (15).",
      guardrail: "La recomendación prioriza revisión. No afirma infracción, libertad de operación, registrabilidad ni intención futura.",
    },
  }
}

function aggregateActivity(rows: ActivityRow[]) {
  const map = new Map<string, Aggregate>()
  const now = Date.now()
  for (const row of rows) {
    const assetType = row.entity_type === "patent" ? "patent" : "trademark"
    const quarter = quarterIndex(row.filing_date, now)
    for (const rawCode of new Set(Array.isArray(row.classification_codes) ? row.classification_codes : [])) {
      const code = String(rawCode).trim()
      if (!code) continue
      const key = `${assetType}:${code}`
      const current = map.get(key) ?? { count: 0, quarters: new Set<number>() }
      current.count += 1
      if (quarter !== null) current.quarters.add(quarter)
      map.set(key, current)
    }
  }
  return map
}

function quarterIndex(value: string | null, now: number) {
  if (!value) return null
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(timestamp)) return null
  const days = Math.max(0, Math.floor((now - timestamp) / 86_400_000))
  const quarter = Math.floor(days / 90)
  return quarter >= 0 && quarter < 4 ? quarter : null
}

function splitKey(key: string): [string, string] {
  const index = key.indexOf(":")
  return [key.slice(0, index), key.slice(index + 1)]
}

function emptyMarket() {
  return {
    current_filings: 0,
    previous_filings: 0,
    current_companies: 0,
    previous_companies: 0,
    entrant_companies: 0,
    experimental_companies: 0,
  }
}

function emptyGapItem(assetType: "patent" | "trademark", code: string, own: Aggregate, competitor: Aggregate): PortfolioGapItem {
  return {
    code,
    asset_type: assetType,
    classification: assetType === "patent" ? "IPC" : "Niza",
    own_filings: own.count,
    competitor_filings: competitor.count,
    competitor_active_quarters: competitor.quarters.size,
    market: emptyMarket(),
  }
}

async function loadMarketStats(admin: SupabaseClient, gaps: PortfolioGapItem[]) {
  const result = new Map<string, PortfolioGapItem["market"]>()
  const grouped: Record<"patent" | "trademark", string[]> = { patent: [], trademark: [] }
  for (const gap of gaps) grouped[gap.asset_type].push(gap.code)

  await Promise.all((Object.keys(grouped) as Array<keyof typeof grouped>).map(async assetType => {
    const codes = [...new Set(grouped[assetType])].slice(0, 50)
    if (!codes.length) return
    const { data, error } = await admin.rpc("classification_market_stats", {
      p_entity_type: assetType,
      p_codes: codes,
      p_window_days: MARKET_WINDOW_DAYS,
    })
    if (error) throw new Error(`No pudimos medir convergencia de mercado: ${error.message}`)
    for (const row of (data ?? []) as MarketStatRow[]) {
      result.set(`${assetType}:${row.code}`, {
        current_filings: Number(row.current_filings ?? 0),
        previous_filings: Number(row.previous_filings ?? 0),
        current_companies: Number(row.current_companies ?? 0),
        previous_companies: Number(row.previous_companies ?? 0),
        entrant_companies: Number(row.entrant_companies ?? 0),
        experimental_companies: Number(row.experimental_companies ?? 0),
      })
    }
  }))
  return result
}

function buildRecommendation(item: PortfolioGapItem): PortfolioRecommendation {
  const score = scoreRecommendation({
    competitorFilings: item.competitor_filings,
    ownFilings: item.own_filings,
    activeQuarters: item.competitor_active_quarters,
    entrantCompanies: item.market.entrant_companies,
    currentCompanies: item.market.current_companies,
    exactClassification: true,
  })
  const asset = item.asset_type === "patent" ? "técnica" : "comercial"
  const action = item.asset_type === "patent"
    ? `Revisar cobertura técnica, antecedentes y libertad de operación alrededor de IPC ${item.code}.`
    : `Revisar cobertura marcaria y exposición competitiva alrededor de Niza ${item.code}.`

  return {
    ...item,
    score,
    headline: `Brecha ${asset} en ${item.classification} ${item.code}`,
    action,
    evidence: [
      `Competidor: ${item.competitor_filings} expedientes / 360 días; empresa propia: ${item.own_filings}.`,
      `Persistencia: actividad en ${item.competitor_active_quarters} de 4 trimestres.`,
      `Mercado / 180 días: ${item.market.current_companies} actores activos y ${item.market.entrant_companies} entrantes repetidos.`,
    ],
    guardrail: "Prioriza una revisión humana; no es una conclusión jurídica ni una predicción de conducta futura.",
  }
}

function gapSort(a: PortfolioGapItem, b: PortfolioGapItem) {
  return b.competitor_filings - a.competitor_filings
    || b.competitor_active_quarters - a.competitor_active_quarters
    || a.code.localeCompare(b.code)
}

function toIdentity(row: IdentityRow) {
  return {
    id: String(row.id),
    canonical_name: String(row.canonical_name),
    country: row.country ? String(row.country) : null,
    resolution_confidence: Number(row.resolution_confidence ?? 0),
  }
}
