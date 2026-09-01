import { createAdminClient } from "@/lib/supabase/admin"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { hasEpoOpsCredentials, searchEpoPatentFamilies } from "@/lib/intelligence/epo-ops"
import { searchGdeltNews } from "@/lib/intelligence/gdelt"
import { searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { normalizeIntelligenceSearchText } from "@/lib/intelligence/source-change-recorder"

export type StrategicWatchType = "technology" | "company" | "competitor"

export type StrategicWatch = {
  id: string
  watch_type: StrategicWatchType
  query: string
  is_active: boolean
  created_at: string
  last_checked_at: string | null
  last_reviewed_at: string | null
}

export type StrategicCandidateSignal = {
  signal_key: string
  source_key: "inapi_open_data" | "openalex" | "crossref" | "gdelt" | "epo_ops"
  event_type: "patent" | "trademark" | "publication" | "news"
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: "alta" | "media" | "baja"
  payload: Record<string, unknown>
}

type AdminClient = ReturnType<typeof createAdminClient>

const PATENT_WINDOW_DAYS = 365
const TRADEMARK_WINDOW_DAYS = 365
const SOURCE_CHANGE_WINDOW_DAYS = 30
const SCIENCE_WINDOW_DAYS = 180
const NEWS_WINDOW_DAYS = 14

export async function scanStrategicWatch(admin: AdminClient, watch: StrategicWatch): Promise<StrategicCandidateSignal[]> {
  const now = new Date()
  const tasks: Array<Promise<StrategicCandidateSignal[]>> = [
    scanObservedSourceChanges(admin, watch, daysAgo(now, SOURCE_CHANGE_WINDOW_DAYS)),
    scanPatents(admin, watch, daysAgo(now, PATENT_WINDOW_DAYS)),
    scanNews(watch, daysAgo(now, NEWS_WINDOW_DAYS), now),
  ]

  if (watch.watch_type === "technology") {
    tasks.push(scanScience(watch, daysAgo(now, SCIENCE_WINDOW_DAYS), now))
    if (hasEpoOpsCredentials()) tasks.push(scanEpoFamilies(watch))
  } else {
    tasks.push(scanTrademarks(admin, watch, daysAgo(now, TRADEMARK_WINDOW_DAYS)))
  }

  const groups = await Promise.all(tasks.map(task => safe(task, [])))
  const unique = new Map<string, StrategicCandidateSignal>()
  for (const signal of groups.flat()) {
    const current = unique.get(signal.signal_key)
    if (!current || relevanceRank(signal.relevance) > relevanceRank(current.relevance)) unique.set(signal.signal_key, signal)
  }

  return [...unique.values()]
}

async function scanObservedSourceChanges(admin: AdminClient, watch: StrategicWatch, from: Date): Promise<StrategicCandidateSignal[]> {
  const normalizedQuery = normalizeIntelligenceSearchText(watch.query)
  if (!normalizedQuery) return []

  let query = admin
    .from("intelligence_source_events")
    .select("id,entity_type,dataset,source_record_id,event_type,title,summary,source_url,source_date,observed_at,materiality,changed_fields,before_snapshot,after_snapshot")
    .gte("observed_at", from.toISOString())
    .ilike("search_text", `%${escapeLike(normalizedQuery)}%`)
    .order("observed_at", { ascending: false })
    .limit(24)

  if (watch.watch_type === "technology") query = query.eq("entity_type", "patent")

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map(row => ({
    signal_key: `inapi_open_data:change:${row.id}`,
    source_key: "inapi_open_data" as const,
    event_type: row.entity_type === "trademark" ? "trademark" as const : "patent" as const,
    title: row.title || (row.entity_type === "trademark" ? "Cambio en expediente marcario" : "Cambio en expediente de patente"),
    summary: row.summary || "VIDENTIA detectó una modificación en la fuente oficial de INAPI.",
    source_url: row.source_url,
    occurred_at: row.observed_at,
    relevance: row.materiality === "alta" || row.materiality === "media" ? row.materiality : "baja" as const,
    payload: {
      source_change: true,
      source_change_id: row.id,
      source_change_type: row.event_type,
      dataset: row.dataset,
      source_record_id: row.source_record_id,
      source_date: row.source_date,
      observed_at: row.observed_at,
      changed_fields: row.changed_fields,
      before_snapshot: row.before_snapshot,
      after_snapshot: row.after_snapshot,
    },
  }))
}

async function scanPatents(admin: AdminClient, watch: StrategicWatch, from: Date): Promise<StrategicCandidateSignal[]> {
  const escaped = escapeLike(watch.query)
  const column = watch.watch_type === "technology" ? "title" : "applicants"
  const { data, error } = await admin
    .from("patent_records")
    .select("id,source_record_id,application_number,title,applicants,status,country,filing_date,publication_date,source_url")
    .ilike(column, `%${escaped}%`)
    .gte("filing_date", dateOnly(from))
    .order("filing_date", { ascending: false, nullsFirst: false })
    .limit(12)

  if (error) throw error
  return (data ?? []).map(row => ({
    signal_key: `inapi_open_data:patent:${row.source_record_id || row.id}`,
    source_key: "inapi_open_data" as const,
    event_type: "patent" as const,
    title: row.title || "Patente sin título",
    summary: watch.watch_type === "technology"
      ? `Actividad de patente relacionada con ${watch.query}. ${row.applicants ? `Solicitante: ${row.applicants}.` : ""}`.trim()
      : `Actividad de patente asociada a ${watch.query}.${row.status ? ` Estado: ${row.status}.` : ""}`,
    source_url: row.source_url,
    occurred_at: row.publication_date || row.filing_date,
    relevance: watch.watch_type === "technology" ? "media" as const : "alta" as const,
    payload: {
      application_number: row.application_number,
      applicants: row.applicants,
      status: row.status,
      country: row.country,
      filing_date: row.filing_date,
      publication_date: row.publication_date,
    },
  }))
}

async function scanTrademarks(admin: AdminClient, watch: StrategicWatch, from: Date): Promise<StrategicCandidateSignal[]> {
  const escaped = escapeLike(watch.query)
  const { data, error } = await admin
    .from("trademark_records")
    .select("id,nombre,solicitante,numero_solicitud,estado,fecha_presentacion,source_url")
    .ilike("solicitante", `%${escaped}%`)
    .gte("fecha_presentacion", dateOnly(from))
    .order("fecha_presentacion", { ascending: false, nullsFirst: false })
    .limit(12)

  if (error) throw error
  return (data ?? []).map(row => ({
    signal_key: `inapi_open_data:trademark:${row.id}`,
    source_key: "inapi_open_data" as const,
    event_type: "trademark" as const,
    title: row.nombre || "Marca sin denominación",
    summary: `Solicitud de marca asociada a ${watch.query}.${row.estado ? ` Estado: ${row.estado}.` : ""}`,
    source_url: row.source_url,
    occurred_at: row.fecha_presentacion,
    relevance: "alta" as const,
    payload: {
      applicant: row.solicitante,
      application_number: row.numero_solicitud,
      status: row.estado,
      filing_date: row.fecha_presentacion,
    },
  }))
}

async function scanScience(watch: StrategicWatch, from: Date, to: Date): Promise<StrategicCandidateSignal[]> {
  const [openAlex, crossref] = await Promise.all([
    safe(searchOpenAlexWorks(watch.query, from, to, 10), []),
    safe(searchCrossrefWorks(watch.query, from, to, 10), []),
  ])
  const seenDoi = new Set<string>()
  const rows: StrategicCandidateSignal[] = []

  for (const item of openAlex) {
    const doi = normalizeDoi(item.doi)
    if (doi) seenDoi.add(doi)
    rows.push({
      signal_key: `openalex:publication:${item.sourceRecordId}`,
      source_key: "openalex",
      event_type: "publication",
      title: item.title,
      summary: [item.topic, item.institutions.slice(0, 2).join(", ")].filter(Boolean).join(" · ") || "Publicación científica relacionada.",
      source_url: item.url,
      occurred_at: item.date,
      relevance: "media",
      payload: { doi: item.doi, cited_by_count: item.citedByCount, authors: item.authors, institutions: item.institutions, topic: item.topic },
    })
  }

  for (const item of crossref) {
    const doi = normalizeDoi(item.doi)
    if (doi && seenDoi.has(doi)) continue
    rows.push({
      signal_key: `crossref:publication:${item.sourceRecordId}`,
      source_key: "crossref",
      event_type: "publication",
      title: item.title,
      summary: [item.publisher, item.subjects.slice(0, 2).join(", ")].filter(Boolean).join(" · ") || "Publicación indexada relacionada.",
      source_url: item.url,
      occurred_at: item.date,
      relevance: "media",
      payload: { doi: item.doi, publisher: item.publisher, cited_by_count: item.citedByCount, authors: item.authors, subjects: item.subjects },
    })
  }

  return rows
}

async function scanEpoFamilies(watch: StrategicWatch): Promise<StrategicCandidateSignal[]> {
  const items = await searchEpoPatentFamilies(watch.query, 5)
  return items.map(item => ({
    signal_key: `epo_ops:family:${item.sourceRecordId}`,
    source_key: "epo_ops" as const,
    event_type: "patent" as const,
    title: item.title,
    summary: item.jurisdictions.length
      ? `Familia global observada en ${item.jurisdictions.length} jurisdicciones: ${item.jurisdictions.join(", ")}.`
      : "Familia global observada en EPO OPS.",
    source_url: item.url,
    occurred_at: null,
    relevance: "media" as const,
    payload: {
      publication: item.publication,
      family_members: item.familyMembers,
      jurisdictions: item.jurisdictions,
      coverage: "EPO OPS simple patent family",
    },
  }))
}

async function scanNews(watch: StrategicWatch, from: Date, to: Date): Promise<StrategicCandidateSignal[]> {
  const items = await searchGdeltNews(watch.query, from, to, 10)
  return items.map(item => ({
    signal_key: `gdelt:news:${item.sourceRecordId}`,
    source_key: "gdelt" as const,
    event_type: "news" as const,
    title: item.title,
    summary: [item.domain, item.sourceCountry].filter(Boolean).join(" · ") || "Cobertura pública reciente.",
    source_url: item.url,
    occurred_at: item.date,
    relevance: "baja" as const,
    payload: { domain: item.domain, source_country: item.sourceCountry, language: item.language },
  }))
}

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch (error) { console.warn("[strategic-watch] source unavailable", error); return fallback }
}

function escapeLike(value: string) { return value.replace(/[%_]/g, "\\$&") }
function dateOnly(value: Date) { return value.toISOString().slice(0, 10) }
function daysAgo(reference: Date, days: number) { return new Date(reference.getTime() - days * 86400000) }
function normalizeDoi(value: string | null) { return value ? value.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "") : null }
function relevanceRank(value: StrategicCandidateSignal["relevance"]) { return value === "alta" ? 3 : value === "media" ? 2 : 1 }
