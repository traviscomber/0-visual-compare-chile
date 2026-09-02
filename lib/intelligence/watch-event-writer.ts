import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

export type IntelligenceWatchEventWrite = {
  user_id: string
  watch_id: string
  signal_key: string
  source_key: string
  event_type: string
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: string
  payload: Record<string, unknown>
  last_seen_at: string
  updated_at: string
}

type ExistingWatchEvent = {
  user_id: string
  watch_id: string
  signal_key: string
  relevance: string
  payload: Record<string, unknown> | null
}

const BATCH_SIZE = 100

export async function persistIntelligenceWatchEvents(
  client: SupabaseClient,
  input: IntelligenceWatchEventWrite[],
) {
  if (!input.length) return { persisted: 0 }

  let persisted = 0
  for (let offset = 0; offset < input.length; offset += BATCH_SIZE) {
    const batch = input.slice(offset, offset + BATCH_SIZE)
    const existing = await loadExisting(client, batch)
    const rows = batch.map(row => mergeWithExisting(row, existing.get(eventKey(row))))
    const { data, error } = await client
      .from("intelligence_watch_events")
      .upsert(rows, { onConflict: "user_id,watch_id,signal_key", ignoreDuplicates: false })
      .select("id")

    if (error) throw new Error(`Could not persist strategic watch events: ${error.message}`)
    persisted += data?.length ?? 0
  }

  return { persisted }
}

async function loadExisting(client: SupabaseClient, rows: IntelligenceWatchEventWrite[]) {
  const userIds = unique(rows.map(row => row.user_id))
  const watchIds = unique(rows.map(row => row.watch_id))
  const signalKeys = unique(rows.map(row => row.signal_key))

  let query = client
    .from("intelligence_watch_events")
    .select("user_id,watch_id,signal_key,relevance,payload")
    .in("watch_id", watchIds)
    .in("signal_key", signalKeys)
  if (userIds.length === 1) query = query.eq("user_id", userIds[0])
  else query = query.in("user_id", userIds)

  const { data, error } = await query
  if (error) throw new Error(`Could not load existing strategic watch events: ${error.message}`)

  const map = new Map<string, ExistingWatchEvent>()
  for (const row of data ?? []) {
    const normalized: ExistingWatchEvent = {
      user_id: String(row.user_id ?? ""),
      watch_id: String(row.watch_id ?? ""),
      signal_key: String(row.signal_key ?? ""),
      relevance: String(row.relevance ?? "baja"),
      payload: record(row.payload),
    }
    map.set(eventKey(normalized), normalized)
  }
  return map
}

function mergeWithExisting(row: IntelligenceWatchEventWrite, existing?: ExistingWatchEvent) {
  if (!existing) return row

  const previousPayload = existing.payload ?? {}
  const incomingPayload = row.payload ?? {}
  const previousQuality = qualityVersion(previousPayload)
  const incomingQuality = qualityVersion(incomingPayload)
  const preservePreviousQuality = Boolean(previousQuality && !incomingQuality)

  return {
    ...row,
    relevance: preservePreviousQuality ? existing.relevance : row.relevance,
    payload: {
      ...previousPayload,
      ...incomingPayload,
      ...(preservePreviousQuality ? researchQualityFields(previousPayload) : {}),
    },
  }
}

function researchQualityFields(payload: Record<string, unknown>) {
  return {
    ...(payload.quality_version !== undefined ? { quality_version: payload.quality_version } : {}),
    ...(payload.relevance_score !== undefined ? { relevance_score: payload.relevance_score } : {}),
    ...(payload.relevance_factors !== undefined ? { relevance_factors: payload.relevance_factors } : {}),
    ...(payload.signal_kind !== undefined ? { signal_kind: payload.signal_kind } : {}),
    ...(payload.concept_matches !== undefined ? { concept_matches: payload.concept_matches } : {}),
    ...(payload.company_fit_matches !== undefined ? { company_fit_matches: payload.company_fit_matches } : {}),
    ...(payload.cluster_size !== undefined ? { cluster_size: payload.cluster_size } : {}),
    ...(payload.cluster_sources !== undefined ? { cluster_sources: payload.cluster_sources } : {}),
    ...(payload.cluster_titles !== undefined ? { cluster_titles: payload.cluster_titles } : {}),
    ...(payload.cluster_signal_keys !== undefined ? { cluster_signal_keys: payload.cluster_signal_keys } : {}),
  }
}

function qualityVersion(payload: Record<string, unknown>) {
  const value = payload.quality_version
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function eventKey(row: { user_id: string; watch_id: string; signal_key: string }) {
  return `${row.user_id}\u0000${row.watch_id}\u0000${row.signal_key}`
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}
