import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  mergeIntelligenceWatchEvent,
  type ExistingWatchEvent,
  type IntelligenceWatchEventWrite,
} from "@/lib/intelligence/watch-event-merge"

export type { IntelligenceWatchEventWrite } from "@/lib/intelligence/watch-event-merge"

const BATCH_SIZE = 100

export async function persistIntelligenceWatchEvents(
  client: SupabaseClient,
  input: IntelligenceWatchEventWrite[],
) {
  if (!input.length) return { persisted: 0, created: [] as IntelligenceWatchEventWrite[] }

  let persisted = 0
  const created: IntelligenceWatchEventWrite[] = []
  for (let offset = 0; offset < input.length; offset += BATCH_SIZE) {
    const batch = input.slice(offset, offset + BATCH_SIZE)
    const existing = await loadExisting(client, batch)
    const rows = batch.map(row => mergeIntelligenceWatchEvent(row, existing.get(eventKey(row))))
    for (const row of batch) {
      if (!existing.has(eventKey(row))) created.push(row)
    }

    const { data, error } = await client
      .from("intelligence_watch_events")
      .upsert(rows, { onConflict: "user_id,watch_id,signal_key", ignoreDuplicates: false })
      .select("id")

    if (error) throw new Error(`Could not persist strategic watch events: ${error.message}`)
    persisted += data?.length ?? 0
  }

  return { persisted, created }
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

function eventKey(row: { user_id: string; watch_id: string; signal_key: string }) {
  return `${row.user_id}\u0000${row.watch_id}\u0000${row.signal_key}`
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}
