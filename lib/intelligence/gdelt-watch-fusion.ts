import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveLegalEntityInGleif, type GleifLegalEntityMatch } from "@/lib/intelligence/gleif"

const LOOKBACK_HOURS = 6
const WATCH_PAGE_SIZE = 100
const SIGNAL_LIMIT_PER_WATCH = 12
const GLEIF_BUDGET_MS = 7_500

type WatchRow = { id: string; user_id: string; watch_type: "technology" | "company" | "competitor"; query: string; normalized_query: string; is_active: boolean }
type GdeltSignalRow = { global_event_id: number | string; event_date: string | null; actor1_name: string | null; actor2_name: string | null; action_geo_full_name: string | null; event_code: string | null; goldstein_scale: number | null; event_tone: number | null; source_url: string | null; mention_count: number | string | null; distinct_sources: number | string | null; average_confidence: number | string | null; document_tone: number | string | null; organizations: string[] | null; persons: string[] | null; themes: string[] | null; primary_document_identifier: string | null }

export type GdeltWatchFusionSummary = { watchesScanned: number; candidates: number; persisted: number; gleifResolved: number; generatedAt: string }

export async function fuseGdeltIntoStrategicWatches(admin: SupabaseClient, now = new Date()): Promise<GdeltWatchFusionSummary> {
  const generatedAt = now.toISOString()
  const since = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString()
  const watches = await loadEligibleWatches(admin)
  let candidates = 0, persisted = 0, gleifResolved = 0
  const gleifStartedAt = Date.now()
  const gleifCache = new Map<string, GleifLegalEntityMatch | null>()

  for (const watch of watches) {
    let gleif: GleifLegalEntityMatch | null = null
    if ((watch.watch_type === "company" || watch.watch_type === "competitor") && Date.now() - gleifStartedAt < GLEIF_BUDGET_MS) {
      const key = watch.normalized_query || normalize(watch.query)
      if (gleifCache.has(key)) gleif = gleifCache.get(key) ?? null
      else {
        try { gleif = await resolveLegalEntityInGleif(watch.query); gleifCache.set(key, gleif); if (gleif) gleifResolved += 1 }
        catch (error) { gleifCache.set(key, null); console.warn("[gdelt/watch-fusion] GLEIF unavailable", { watchId: watch.id, error: error instanceof Error ? error.message : String(error) }) }
      }
    }

    const { data: signalRows, error: signalError } = await admin.rpc("search_gdelt_watch_signals", { p_query: watch.query, p_since: since, p_limit: SIGNAL_LIMIT_PER_WATCH })
    if (signalError) throw new Error(`Could not search GDELT strategic signals for watch ${watch.id}: ${signalError.message}`)
    const rows = (signalRows ?? []) as GdeltSignalRow[]
    candidates += rows.length
    if (!rows.length) continue
    const { data: saved, error: saveError } = await admin.from("intelligence_watch_events").upsert(rows.map(row => toWatchEvent(watch, row, gleif, generatedAt)), { onConflict: "user_id,watch_id,signal_key", ignoreDuplicates: false }).select("id")
    if (saveError) throw new Error(`Could not persist GDELT strategic watch events: ${saveError.message}`)
    persisted += saved?.length ?? 0
  }
  return { watchesScanned: watches.length, candidates, persisted, gleifResolved, generatedAt }
}

async function loadEligibleWatches(admin: SupabaseClient) {
  const watches: WatchRow[] = []
  for (let from = 0; ; from += WATCH_PAGE_SIZE) {
    const { data, error } = await admin.from("intelligence_watches")
      .select("id,user_id,watch_type,query,normalized_query,is_active")
      .eq("is_active", true)
      .in("watch_type", ["technology", "company", "competitor"])
      .order("created_at", { ascending: true })
      .range(from, from + WATCH_PAGE_SIZE - 1)
    if (error) throw new Error(`Could not load strategic watches for GDELT fusion: ${error.message}`)
    const page = (data ?? []) as WatchRow[]
    watches.push(...page)
    if (page.length < WATCH_PAGE_SIZE) break
  }
  return watches
}

function toWatchEvent(watch: WatchRow, row: GdeltSignalRow, gleif: GleifLegalEntityMatch | null, now: string) {
  const mentionCount = integer(row.mention_count), distinctSources = integer(row.distinct_sources), confidence = number(row.average_confidence), goldstein = number(row.goldstein_scale)
  const organizations = cleanStrings(row.organizations), persons = cleanStrings(row.persons), themes = cleanStrings(row.themes)
  const relevance = scoreRelevance({ mentionCount, distinctSources, confidence, goldstein, organizations, query: watch.query })
  const actors = [row.actor1_name, row.actor2_name].filter(Boolean).join(" ↔ ") || watch.query
  const place = row.action_geo_full_name ? ` · ${row.action_geo_full_name}` : ""
  return {
    user_id: watch.user_id, watch_id: watch.id, signal_key: `gdelt_raw_feed:event:${row.global_event_id}`, source_key: "gdelt_raw_feed", event_type: "news",
    title: `Señal global: ${actors}`,
    summary: `Evento GDELT relacionado con ${watch.query}${place}. ${mentionCount} menciones en ${distinctSources} fuentes; confianza media ${confidence == null ? "n/d" : `${Math.round(confidence)}%`}.`,
    source_url: row.primary_document_identifier || row.source_url, occurred_at: row.event_date, relevance,
    payload: { role: "strategic_signal", fusion_version: "gdelt-events-mentions-gkg-gleif-v1", canonical_event_identity: String(row.global_event_id), event_code: row.event_code, goldstein_scale: goldstein, event_tone: number(row.event_tone), document_tone: number(row.document_tone), mention_count: mentionCount, distinct_sources: distinctSources, average_confidence: confidence, organizations, persons, themes: themes.slice(0, 40), primary_document_identifier: row.primary_document_identifier, action_geo_full_name: row.action_geo_full_name, gleif: gleif ? { lei: gleif.lei, legal_name: gleif.legalName, country: gleif.country, registration_status: gleif.registrationStatus, entity_status: gleif.entityStatus, source_url: gleif.sourceUrl, resolution: gleif.resolution, confidence: gleif.confidence } : null, evidence_policy: "GDELT event plus exact mention/document joins; GLEIF only when normalized legal name resolves to one exact LEI." },
    last_seen_at: now, updated_at: now,
  }
}

function scoreRelevance(input: { mentionCount: number; distinctSources: number; confidence: number | null; goldstein: number | null; organizations: string[]; query: string }) {
  let score = 0
  if (input.distinctSources >= 3) score += 2
  if (input.mentionCount >= 5) score += 1
  if (input.confidence != null && input.confidence >= 70) score += 1
  if (input.goldstein != null && Math.abs(input.goldstein) >= 5) score += 1
  const needle = normalize(input.query)
  if (needle && input.organizations.some(item => normalize(item).includes(needle))) score += 1
  return score >= 4 ? "alta" : score >= 2 ? "media" : "baja"
}
function cleanStrings(values: string[] | null) { return [...new Set((values ?? []).map(value => String(value).trim()).filter(Boolean))].slice(0, 80) }
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() }
function number(value: number | string | null | undefined) { if (value === null || value === undefined || value === "") return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null }
function integer(value: number | string | null | undefined) { const parsed = number(value); return parsed == null ? 0 : Math.max(0, Math.trunc(parsed)) }
