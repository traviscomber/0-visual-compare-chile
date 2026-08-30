import { countOpenAlexWorks, searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchGdeltNews } from "@/lib/intelligence/gdelt"

export type TechnologyTrend = "acelerando" | "estable" | "desacelerando" | "sin_base"

export async function buildTechnologySignals(query: string, windowDays = 180) {
  const now = new Date()
  const currentFrom = daysAgo(now, windowDays)
  const previousTo = new Date(currentFrom.getTime() - 1000)
  const previousFrom = daysAgo(previousTo, windowDays)
  const newsFrom = daysAgo(now, 7)

  const [currentCount, previousCount, openAlexWorks, crossrefWorks, news] = await Promise.all([
    safe(() => countOpenAlexWorks(query, currentFrom, now), 0),
    safe(() => countOpenAlexWorks(query, previousFrom, previousTo), 0),
    safe(() => searchOpenAlexWorks(query, currentFrom, now, 10), []),
    safe(() => searchCrossrefWorks(query, currentFrom, now, 10), []),
    safe(() => searchGdeltNews(query, newsFrom, now, 10), []),
  ])

  const growth = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : null
  const trend: TechnologyTrend = previousCount === 0
    ? (currentCount > 0 ? "sin_base" : "estable")
    : growth !== null && growth >= 20
      ? "acelerando"
      : growth !== null && growth <= -20
        ? "desacelerando"
        : "estable"

  const publicationEvidence = dedupePublications(openAlexWorks, crossrefWorks)

  return {
    query,
    period_days: windowDays,
    observed_at: now.toISOString(),
    momentum: {
      current_publications: currentCount,
      previous_publications: previousCount,
      change_percent: growth === null ? null : Math.round(growth * 10) / 10,
      trend,
      basis: "Actividad de publicaciones indexadas por OpenAlex; es una señal de actividad, no una predicción.",
    },
    evidence: {
      publications: publicationEvidence,
      news,
    },
    sources: {
      openalex: { available: true, evidence_count: openAlexWorks.length },
      crossref: { available: true, evidence_count: crossrefWorks.length },
      gdelt: { available: true, evidence_count: news.length },
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

async function safe<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try { return await operation() } catch (error) { console.warn("[technology-signals] source unavailable", error); return fallback }
}
function daysAgo(reference: Date, days: number) { return new Date(reference.getTime() - days * 24 * 60 * 60 * 1000) }
function normalizeDoi(value: string | null) { return value ? value.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "") : null }
