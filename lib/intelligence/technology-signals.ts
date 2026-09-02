import { queryOpenAlexWindow, type OpenAlexWorkSignal } from "@/lib/intelligence/openalex"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchGdeltNews } from "@/lib/intelligence/gdelt"
import { buildTechnologyCorroboration } from "@/lib/intelligence/technology-corroboration-rules"
import { buildTechnologyPatentSignal, emptyTechnologyPatentSignal } from "@/lib/intelligence/technology-patent-corroboration"
import { buildStrategicSearchIntent, type StrategicSearchScope } from "@/lib/intelligence/search-intent"

export type TechnologyTrend = "acelerando" | "estable" | "desacelerando" | "sin_base" | "no_disponible"

type SourceResult<T> = {
  ok: boolean
  value: T
}

export async function buildTechnologySignals(query: string, windowDays = 180, scope: StrategicSearchScope = "both") {
  const now = new Date()
  const currentFrom = daysAgo(now, windowDays)
  const previousTo = new Date(currentFrom.getTime() - 1000)
  const previousFrom = daysAgo(previousTo, windowDays)
  const newsFrom = daysAgo(now, 7)
  const intent = buildStrategicSearchIntent(query, scope)
  const globalQuery = intent.globalQueries[0] ?? intent.canonicalQuery
  const chileQuery = intent.chileQueries[0] ?? intent.canonicalQuery
  const useGlobal = scope !== "chile"
  const useChile = scope !== "global"

  const disabledOpenAlex: SourceResult<{ count: number; works: OpenAlexWorkSignal[] }> = { ok: false, value: { count: 0, works: [] } }
  const disabledWorks: SourceResult<Awaited<ReturnType<typeof searchCrossrefWorks>>> = { ok: false, value: [] }
  const disabledPatents: SourceResult<ReturnType<typeof emptyTechnologyPatentSignal>> = { ok: false, value: emptyTechnologyPatentSignal() }
  const disabledNews: SourceResult<Awaited<ReturnType<typeof searchGdeltNews>>> = { ok: false, value: [] }

  const [currentOpenAlexResult, previousOpenAlexResult, crossrefWorksResult, patentSignalResult, newsResult] = await Promise.all([
    useGlobal ? captureSource("openalex-current", () => queryOpenAlexWindow(globalQuery, currentFrom, now, 10), { count: 0, works: [] as OpenAlexWorkSignal[] }) : Promise.resolve(disabledOpenAlex),
    useGlobal ? captureSource("openalex-previous", () => queryOpenAlexWindow(globalQuery, previousFrom, previousTo, 1), { count: 0, works: [] as OpenAlexWorkSignal[] }) : Promise.resolve(disabledOpenAlex),
    useGlobal ? captureSource("crossref", () => searchCrossrefWorks(globalQuery, currentFrom, now, 10), []) : Promise.resolve(disabledWorks),
    useChile ? captureSource("inapi-patents", () => buildTechnologyPatentSignal(chileQuery, currentFrom, now), emptyTechnologyPatentSignal()) : Promise.resolve(disabledPatents),
    captureSource("gdelt", () => searchGdeltNews(scope === "chile" ? `${chileQuery} Chile` : globalQuery, newsFrom, now, 10), []),
  ])

  const openAlexAvailable = currentOpenAlexResult.ok && previousOpenAlexResult.ok
  const currentCount = openAlexAvailable ? currentOpenAlexResult.value.count : null
  const previousCount = openAlexAvailable ? previousOpenAlexResult.value.count : null
  const growth = currentCount !== null && previousCount !== null && previousCount > 0
    ? ((currentCount - previousCount) / previousCount) * 100
    : null

  const trend: TechnologyTrend = !openAlexAvailable
    ? "no_disponible"
    : previousCount === 0
      ? (currentCount && currentCount > 0 ? "sin_base" : "estable")
      : growth !== null && growth >= 20
        ? "acelerando"
        : growth !== null && growth <= -20
          ? "desacelerando"
          : "estable"

  const publicationEvidence = dedupePublications(currentOpenAlexResult.value.works, crossrefWorksResult.value)
  const corroboration = buildTechnologyCorroboration({
    researchAvailable: openAlexAvailable,
    currentPublications: currentCount,
    researchTrend: trend,
    patentsAvailable: patentSignalResult.ok,
    recentPatentMatches: patentSignalResult.value.recentMatches,
    historicalPatentMatches: patentSignalResult.value.historicalMatches,
  })

  return {
    query,
    period_days: windowDays,
    observed_at: now.toISOString(),
    search_intent: {
      scope,
      chile_query: useChile ? chileQuery : null,
      global_query: useGlobal ? globalQuery : null,
      aliases: intent.aliases,
      normalization: "bilingual-es-en-v1",
    },
    momentum: {
      available: openAlexAvailable,
      current_publications: currentCount,
      previous_publications: previousCount,
      change_percent: growth === null ? null : Math.round(growth * 10) / 10,
      trend,
      basis: openAlexAvailable
        ? `Señal conservadora: compara publicaciones cuyo título coincide con la variante global “${globalQuery}” en OpenAlex. La búsqueda local usa “${chileQuery}” como variante separada y no infla el momentum científico.`
        : scope === "chile"
          ? "Ámbito Chile: la investigación científica global queda fuera de esta lectura por decisión del usuario."
          : "OpenAlex no respondió de forma completa. VIDENTIA conserva la evidencia disponible, pero no calcula una variación hasta recuperar una base comparable.",
    },
    corroboration,
    evidence: {
      publications: publicationEvidence,
      patents: patentSignalResult.value.evidence,
      news: newsResult.value,
    },
    patent_signal: {
      available: patentSignalResult.ok,
      recent_matches: patentSignalResult.value.recentMatches,
      selected_matches: patentSignalResult.value.historicalMatches,
      distinct_applicants: patentSignalResult.value.distinctApplicants,
      latest_filing_date: patentSignalResult.value.latestFilingDate,
      basis: patentSignalResult.ok
        ? `Coincidencias de alta precisión en títulos del corpus local de patentes INAPI usando la variante chilena “${chileQuery}”. Se exige relevancia léxica fuerte y no se presenta esta muestra como el universo completo de patentes de la tecnología.`
        : scope === "global"
          ? "Ámbito global: INAPI Chile queda fuera de esta lectura por decisión del usuario."
          : "INAPI no respondió de forma suficiente para construir esta señal.",
    },
    sources: {
      openalex: { available: openAlexAvailable, evidence_count: currentOpenAlexResult.value.works.length },
      crossref: { available: crossrefWorksResult.ok, evidence_count: crossrefWorksResult.value.length },
      inapi_patents: { available: patentSignalResult.ok, evidence_count: patentSignalResult.value.evidence.length },
      gdelt: { available: newsResult.ok, evidence_count: newsResult.value.length },
    },
  }
}

function dedupePublications(openAlex: OpenAlexWorkSignal[], crossref: Awaited<ReturnType<typeof searchCrossrefWorks>>) {
  const seen = new Set<string>()
  const rows: Array<Record<string, unknown>> = []

  for (const item of openAlex) {
    const key = normalizeDoi(item.doi) ?? `oa:${item.sourceRecordId}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(item)
  }
  for (const item of crossref) {
    const key = normalizeDoi(item.doi) ?? `cr:${item.sourceRecordId}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(item)
  }

  return rows
    .sort((a, b) => new Date(String(b.date ?? 0)).getTime() - new Date(String(a.date ?? 0)).getTime())
    .slice(0, 14)
}

async function captureSource<T>(source: string, operation: () => Promise<T>, fallback: T): Promise<SourceResult<T>> {
  try {
    return { ok: true, value: await operation() }
  } catch (error) {
    console.warn(`[technology-signals] ${source} unavailable`, error)
    return { ok: false, value: fallback }
  }
}

function daysAgo(reference: Date, days: number) { return new Date(reference.getTime() - days * 24 * 60 * 60 * 1000) }
function normalizeDoi(value: string | null) { return value ? value.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "") : null }
