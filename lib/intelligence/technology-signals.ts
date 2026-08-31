import { countOpenAlexWorks, searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchGdeltNews } from "@/lib/intelligence/gdelt"

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

  const [currentCountResult, previousCountResult, openAlexWorksResult, crossrefWorksResult, newsResult] = await Promise.all([
    captureSource("openalex-current", () => countOpenAlexWorks(query, currentFrom, now), 0),
    captureSource("openalex-previous", () => countOpenAlexWorks(query, previousFrom, previousTo), 0),
    captureSource("openalex-evidence", () => searchOpenAlexWorks(query, currentFrom, now, 10), []),
    captureSource("crossref", () => searchCrossrefWorks(query, currentFrom, now, 10), []),
    captureSource("gdelt", () => searchGdeltNews(query, newsFrom, now, 10), []),
  ])

  const openAlexAvailable = currentCountResult.ok && previousCountResult.ok && openAlexWorksResult.ok
  const currentCount = openAlexAvailable ? currentCountResult.value : null
  const previousCount = openAlexAvailable ? previousCountResult.value : null
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

  const publicationEvidence = dedupePublications(openAlexWorksResult.value, crossrefWorksResult.value)

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
        ? "Actividad de publicaciones indexadas por OpenAlex; es una señal de actividad, no una predicción."
        : "OpenAlex no respondió de forma completa. VIDENTIA conserva la evidencia disponible, pero no calcula una variación hasta recuperar una base comparable.",
    },
    evidence: {
      publications: publicationEvidence,
      news: newsResult.value,
    },
    sources: {
      openalex: { available: openAlexAvailable, evidence_count: openAlexWorksResult.value.length },
      crossref: { available: crossrefWorksResult.ok, evidence_count: crossrefWorksResult.value.length },
      gdelt: { available: newsResult.ok, evidence_count: newsResult.value.length },
    },
  }
}

function dedupePublications(openAlex: Awaited<ReturnType<typeof searchOpenAlexWorks>>, crossref: Awaited<ReturnType<typeof searchCrossrefWorks>>) {
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
