import { queryOpenAlexWindow, type OpenAlexWorkSignal } from "@/lib/intelligence/openalex"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchGdeltNews } from "@/lib/intelligence/gdelt"
import { buildTechnologyCorroboration } from "@/lib/intelligence/technology-corroboration-rules"
import { buildTechnologyPatentSignal, emptyTechnologyPatentSignal } from "@/lib/intelligence/technology-patent-corroboration"

export type TechnologyTrend = "acelerando" | "estable" | "desacelerando" | "sin_base" | "no_disponible"

type SourceResult<T> = {
  ok: boolean
  value: T
}

export async function buildTechnologySignals(query: string, windowDays = 180) {
  const now = new Date()
  const currentFrom = daysAgo(now, windowDays)
  const previousTo = new Date(currentFrom.getTime() - 1000)
  const previousFrom = daysAgo(previousTo, windowDays)
  const newsFrom = daysAgo(now, 7)

  const [currentOpenAlexResult, previousOpenAlexResult, crossrefWorksResult, patentSignalResult, newsResult] = await Promise.all([
    captureSource("openalex-current", () => queryOpenAlexWindow(query, currentFrom, now, 10), { count: 0, works: [] as OpenAlexWorkSignal[] }),
    captureSource("openalex-previous", () => queryOpenAlexWindow(query, previousFrom, previousTo, 1), { count: 0, works: [] as OpenAlexWorkSignal[] }),
    captureSource("crossref", () => searchCrossrefWorks(query, currentFrom, now, 10), []),
    captureSource("inapi-patents", () => buildTechnologyPatentSignal(query, currentFrom, now), emptyTechnologyPatentSignal()),
    captureSource("gdelt", () => searchGdeltNews(query, newsFrom, now, 10), []),
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
    momentum: {
      available: openAlexAvailable,
      current_publications: currentCount,
      previous_publications: previousCount,
      change_percent: growth === null ? null : Math.round(growth * 10) / 10,
      trend,
      basis: openAlexAvailable
        ? "Señal conservadora: compara publicaciones cuyo título coincide con la consulta en OpenAlex. Patentes INAPI se evalúan como un eje independiente de corroboración y no inflan el momentum científico."
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
      basis: "Coincidencias de alta precisión en títulos del corpus local de patentes INAPI. Se exige relevancia léxica fuerte y no se presenta esta muestra como el universo completo de patentes de la tecnología.",
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
