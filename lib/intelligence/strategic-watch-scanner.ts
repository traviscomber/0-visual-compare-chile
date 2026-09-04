import { createAdminClient } from "@/lib/supabase/admin"
import { searchBcnRegulations } from "@/lib/intelligence/bcn-regulatory"
import { searchCmfRegulations } from "@/lib/intelligence/cmf-regulatory"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchDiarioOficialRegulations } from "@/lib/intelligence/diario-oficial-regulatory"
import { hasEpoOpsCredentials, searchEpoPatentFamilies } from "@/lib/intelligence/epo-ops"
import { searchGoogleNews, type GoogleNewsMarket } from "@/lib/intelligence/google-news"
import { hasMercadoPublicoWatchCredentials, searchMercadoPublicoTenders } from "@/lib/intelligence/mercado-publico-watch"
import { searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { normalizeIntelligenceSearchText } from "@/lib/intelligence/source-change-recorder"
import {
  buildStrategicSearchIntent,
  readStrategicQueryAliases,
  readStrategicSearchScope,
} from "@/lib/intelligence/search-intent"

export type StrategicWatchType = "technology" | "company" | "competitor" | "regulator" | "tender" | "market" | "topic"

export type StrategicWatch = {
  id: string
  watch_type: StrategicWatchType
  query: string
  is_active: boolean
  created_at: string
  last_checked_at: string | null
  last_reviewed_at: string | null
  metadata?: unknown
}

export type StrategicCandidateSignal = {
  signal_key: string
  source_key: "inapi_open_data" | "openalex" | "crossref" | "google_news_rss" | "epo_ops" | "mercado_publico" | "bcn_norms" | "cmf_norms" | "diario_oficial"
  event_type: "patent" | "trademark" | "publication" | "news" | "tender" | "regulation"
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
const MAX_QUERY_VARIANTS_PER_SOURCE = 2

const STRATEGIC_WATCH_TYPES = new Set<StrategicWatchType>(["technology", "company", "competitor", "regulator", "tender", "market", "topic"])
const IP_ENTITY_WATCHES = new Set<StrategicWatchType>(["company", "competitor"])
const NEWS_ONLY_WATCHES = new Set<StrategicWatchType>(["regulator", "tender", "market", "topic"])

export async function scanStrategicWatch(admin: AdminClient, watch: StrategicWatch): Promise<StrategicCandidateSignal[]> {
  const now = new Date()
  const watchType = effectiveWatchType(watch)
  const scope = readStrategicSearchScope(watch.metadata)
  const intent = buildStrategicSearchIntent(watch.query, scope, readStrategicQueryAliases(watch.metadata))
  const tasks: Array<Promise<StrategicCandidateSignal[]>> = []

  if (scope !== "global") {
    if (!NEWS_ONLY_WATCHES.has(watchType)) {
      tasks.push(scanObservedSourceChanges(admin, watch, intent.chileQueries, daysAgo(now, SOURCE_CHANGE_WINDOW_DAYS)))
      tasks.push(scanPatents(admin, watch, intent.chileQueries, daysAgo(now, PATENT_WINDOW_DAYS)))
    }
    if (watchType === "tender" && hasMercadoPublicoWatchCredentials()) tasks.push(scanMercadoPublicoTenders(watch, intent.chileQueries))
    if (watchType === "regulator") {
      tasks.push(scanBcnRegulations(watch, intent.chileQueries))
      tasks.push(scanCmfRegulations(watch, intent.chileQueries))
      tasks.push(scanDiarioOficialRegulations(watch, intent.chileQueries))
    }
    tasks.push(scanNews(watch, intent.chileQueries, daysAgo(now, NEWS_WINDOW_DAYS), now, "chile"))
    if (IP_ENTITY_WATCHES.has(watchType)) tasks.push(scanTrademarks(admin, watch, intent.chileQueries, daysAgo(now, TRADEMARK_WINDOW_DAYS)))
  }

  if (scope !== "chile") {
    tasks.push(scanNews(watch, intent.globalQueries, daysAgo(now, NEWS_WINDOW_DAYS), now, "global"))
    if (watchType === "technology") {
      tasks.push(scanScience(watch, intent.globalQueries, daysAgo(now, SCIENCE_WINDOW_DAYS), now))
      if (hasEpoOpsCredentials()) tasks.push(scanEpoFamilies(watch, intent.globalQueries))
    }
  }

  const groups = await Promise.all(tasks.map(task => safe(task, [])))
  const unique = new Map<string, StrategicCandidateSignal>()
  for (const signal of groups.flat()) {
    const current = unique.get(signal.signal_key)
    if (!current || relevanceRank(signal.relevance) > relevanceRank(current.relevance)) unique.set(signal.signal_key, signal)
  }

  return [...unique.values()]
}

async function scanObservedSourceChanges(admin: AdminClient, watch: StrategicWatch, variants: string[], from: Date): Promise<StrategicCandidateSignal[]> {
  const watchType = effectiveWatchType(watch)
  const groups = await Promise.all(sourceVariants(variants).map(async variant => {
    const normalizedQuery = normalizeIntelligenceSearchText(variant)
    if (!normalizedQuery) return []

    let query = admin
      .from("intelligence_source_events")
      .select("id,entity_type,dataset,source_record_id,event_type,title,summary,source_url,source_date,observed_at,materiality,changed_fields,before_snapshot,after_snapshot")
      .gte("observed_at", from.toISOString())
      .ilike("search_text", `%${escapeLike(normalizedQuery)}%`)
      .order("observed_at", { ascending: false })
      .limit(24)

    if (watchType === "technology") query = query.eq("entity_type", "patent")
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
        matched_query: variant,
        search_scope: "chile",
      },
    }))
  }))
  return dedupeSignals(groups.flat())
}

async function scanPatents(admin: AdminClient, watch: StrategicWatch, variants: string[], from: Date): Promise<StrategicCandidateSignal[]> {
  const watchType = effectiveWatchType(watch)
  const groups = await Promise.all(sourceVariants(variants).map(async variant => {
    const escaped = escapeLike(variant)
    const column = watchType === "technology" ? "title" : "applicants"
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
      summary: watchType === "technology"
        ? `Actividad de patente relacionada con ${watch.query}. ${row.applicants ? `Solicitante: ${row.applicants}.` : ""}`.trim()
        : `Actividad de patente asociada a ${watch.query}.${row.status ? ` Estado: ${row.status}.` : ""}`,
      source_url: row.source_url,
      occurred_at: row.publication_date || row.filing_date,
      relevance: watchType === "technology" ? "media" as const : "alta" as const,
      payload: {
        application_number: row.application_number,
        applicants: row.applicants,
        status: row.status,
        country: row.country,
        filing_date: row.filing_date,
        publication_date: row.publication_date,
        matched_query: variant,
        search_scope: "chile",
      },
    }))
  }))
  return dedupeSignals(groups.flat())
}

async function scanTrademarks(admin: AdminClient, watch: StrategicWatch, variants: string[], from: Date): Promise<StrategicCandidateSignal[]> {
  const groups = await Promise.all(sourceVariants(variants).map(async variant => {
    const escaped = escapeLike(variant)
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
        matched_query: variant,
        search_scope: "chile",
      },
    }))
  }))
  return dedupeSignals(groups.flat())
}

async function scanMercadoPublicoTenders(watch: StrategicWatch, variants: string[]): Promise<StrategicCandidateSignal[]> {
  const groups = await Promise.all(sourceVariants(variants).map(async variant => {
    const items = await searchMercadoPublicoTenders(variant, 10)
    return items.map(item => ({
      signal_key: `mercado_publico:tender:${item.code}`,
      source_key: "mercado_publico" as const,
      event_type: "tender" as const,
      title: item.name,
      summary: [item.buyer, item.status, item.closingDate ? `Cierre ${formatSignalDate(item.closingDate)}` : null].filter(Boolean).join(" · ") || "Licitación activa en Mercado Público.",
      source_url: item.sourceUrl,
      occurred_at: null,
      relevance: "media" as const,
      payload: {
        official_source: true,
        source_record_id: item.code,
        tender_code: item.code,
        description: item.description,
        status: item.status,
        status_code: item.statusCode,
        closing_date: item.closingDate,
        buyer: item.buyer,
        buying_unit: item.buyingUnit,
        region: item.region,
        matched_query: variant,
        search_scope: "chile",
      },
    }))
  }))
  return dedupeSignals(groups.flat())
}

async function scanBcnRegulations(watch: StrategicWatch, variants: string[]): Promise<StrategicCandidateSignal[]> {
  const groups = await Promise.all(sourceVariants(variants).map(async variant => {
    const items = await searchBcnRegulations(variant, 12)
    return items.map(item => ({
      signal_key: `bcn_norms:regulation:${item.sourceRecordId}`,
      source_key: "bcn_norms" as const,
      event_type: "regulation" as const,
      title: item.title,
      summary: [
        item.normType && item.number ? `${item.normType.toUpperCase()} ${item.number}` : item.normType?.toUpperCase(),
        item.organization,
        item.publicationDate ? `Publicada ${formatSignalDate(item.publicationDate)}` : null,
      ].filter(Boolean).join(" · ") || "Norma publicada en Biblioteca del Congreso Nacional.",
      source_url: item.sourceUrl,
      occurred_at: item.publicationDate,
      relevance: "alta" as const,
      payload: {
        official_source: true,
        source_record_id: item.sourceRecordId,
        norm_type: item.normType,
        norm_number: item.number,
        organization: item.organization,
        publication_date: item.publicationDate,
        matched_query: variant,
        search_scope: "chile",
      },
    }))
  }))
  return dedupeSignals(groups.flat())
}

async function scanCmfRegulations(watch: StrategicWatch, variants: string[]): Promise<StrategicCandidateSignal[]> {
  const groups = await Promise.all(sourceVariants(variants).map(async variant => {
    const items = await searchCmfRegulations(variant, 12)
    return items.map(item => ({
      signal_key: `cmf_norms:regulation:${item.sourceRecordId}`,
      source_key: "cmf_norms" as const,
      event_type: "regulation" as const,
      title: item.title,
      summary: [
        item.normType && item.number ? `${item.normType} ${item.number}` : item.normType,
        item.status,
        item.publishedAt ? `Publicada ${formatSignalDate(item.publishedAt)}` : null,
      ].filter(Boolean).join(" · ") || "Normativa reciente publicada por la CMF.",
      source_url: item.sourceUrl,
      occurred_at: item.publishedAt,
      relevance: "alta" as const,
      payload: {
        official_source: true,
        source_record_id: item.sourceRecordId,
        norm_type: item.normType,
        norm_number: item.number,
        status: item.status,
        publication_date: item.publishedAt,
        matched_query: variant,
        search_scope: "chile",
      },
    }))
  }))
  return dedupeSignals(groups.flat())
}

async function scanDiarioOficialRegulations(watch: StrategicWatch, variants: string[]): Promise<StrategicCandidateSignal[]> {
  const groups = await Promise.all(sourceVariants(variants).map(async variant => {
    const items = await searchDiarioOficialRegulations(variant, { days: 3, limit: 12 })
    return items.map(item => ({
      signal_key: `diario_oficial:regulation:${item.cve}`,
      source_key: "diario_oficial" as const,
      event_type: "regulation" as const,
      title: item.title,
      summary: [
        item.section,
        item.edition ? `Edición ${item.edition}` : null,
        `CVE ${item.cve}`,
        `Publicada ${formatSignalDate(item.publicationDate)}`,
      ].filter(Boolean).join(" · "),
      source_url: item.sourceUrl,
      occurred_at: item.publicationDate,
      relevance: "alta" as const,
      payload: {
        official_source: true,
        source_record_id: item.cve,
        cve: item.cve,
        edition: item.edition,
        section: item.section,
        publication_date: item.publicationDate,
        matched_query: variant,
        search_scope: "chile",
      },
    }))
  }))
  return dedupeSignals(groups.flat())
}

async function scanScience(watch: StrategicWatch, variants: string[], from: Date, to: Date): Promise<StrategicCandidateSignal[]> {
  const rows: StrategicCandidateSignal[] = []
  const seenDoi = new Set<string>()

  for (const variant of sourceVariants(variants)) {
    const [openAlex, crossref] = await Promise.all([
      safe(searchOpenAlexWorks(variant, from, to, 8), []),
      safe(searchCrossrefWorks(variant, from, to, 8), []),
    ])

    for (const item of openAlex) {
      const doi = normalizeDoi(item.doi)
      if (doi && seenDoi.has(doi)) continue
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
        payload: { doi: item.doi, cited_by_count: item.citedByCount, authors: item.authors, institutions: item.institutions, topic: item.topic, matched_query: variant, search_scope: "global" },
      })
    }

    for (const item of crossref) {
      const doi = normalizeDoi(item.doi)
      if (doi && seenDoi.has(doi)) continue
      if (doi) seenDoi.add(doi)
      rows.push({
        signal_key: `crossref:publication:${item.sourceRecordId}`,
        source_key: "crossref",
        event_type: "publication",
        title: item.title,
        summary: [item.publisher, item.subjects.slice(0, 2).join(", ")].filter(Boolean).join(" · ") || "Publicación indexada relacionada.",
        source_url: item.url,
        occurred_at: item.date,
        relevance: "media",
        payload: { doi: item.doi, publisher: item.publisher, cited_by_count: item.citedByCount, authors: item.authors, subjects: item.subjects, matched_query: variant, search_scope: "global" },
      })
    }
  }

  return dedupeSignals(rows)
}

async function scanEpoFamilies(watch: StrategicWatch, variants: string[]): Promise<StrategicCandidateSignal[]> {
  const groups = await Promise.all(sourceVariants(variants).map(async variant => {
    const items = await searchEpoPatentFamilies(variant, 5)
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
        matched_query: variant,
        search_scope: "global",
      },
    }))
  }))
  return dedupeSignals(groups.flat())
}

async function scanNews(watch: StrategicWatch, variants: string[], from: Date, to: Date, market: GoogleNewsMarket): Promise<StrategicCandidateSignal[]> {
  const watchType = effectiveWatchType(watch)
  const groups = await Promise.all(sourceVariants(variants).map(async variant => {
    const items = await searchGoogleNews(variant, from, to, 8, market)
    return items.map(item => ({
      signal_key: `google_news_rss:news:${item.sourceRecordId}`,
      source_key: "google_news_rss" as const,
      event_type: "news" as const,
      title: item.title,
      summary: item.publisher || "Cobertura pública reciente.",
      source_url: item.url,
      occurred_at: item.date,
      relevance: watchType === "regulator" || watchType === "tender" ? "media" as const : "baja" as const,
      payload: { publisher: item.publisher, role: "context_only", watch_type: watchType, matched_query: variant, search_scope: market },
    }))
  }))
  return dedupeSignals(groups.flat())
}

function effectiveWatchType(watch: StrategicWatch): StrategicWatchType {
  if (watch.metadata && typeof watch.metadata === "object" && !Array.isArray(watch.metadata)) {
    const value = (watch.metadata as Record<string, unknown>).external_watch_type
    if (typeof value === "string" && STRATEGIC_WATCH_TYPES.has(value as StrategicWatchType)) return value as StrategicWatchType
  }
  return STRATEGIC_WATCH_TYPES.has(watch.watch_type) ? watch.watch_type : "technology"
}

function sourceVariants(values: string[]) {
  return values.slice(0, MAX_QUERY_VARIANTS_PER_SOURCE)
}

function dedupeSignals(values: StrategicCandidateSignal[]) {
  const unique = new Map<string, StrategicCandidateSignal>()
  for (const signal of values) {
    const current = unique.get(signal.signal_key)
    if (!current || relevanceRank(signal.relevance) > relevanceRank(current.relevance)) unique.set(signal.signal_key, signal)
  }
  return [...unique.values()]
}

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch (error) { console.warn("[strategic-watch] source unavailable", error); return fallback }
}

function escapeLike(value: string) { return value.replace(/[%_]/g, "\\$&") }
function dateOnly(value: Date) { return value.toISOString().slice(0, 10) }
function daysAgo(reference: Date, days: number) { return new Date(reference.getTime() - days * 86400000) }
function normalizeDoi(value: string | null) { return value ? value.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "") : null }
function relevanceRank(value: StrategicCandidateSignal["relevance"]) { return value === "alta" ? 3 : value === "media" ? 2 : 1 }
function formatSignalDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date) }
