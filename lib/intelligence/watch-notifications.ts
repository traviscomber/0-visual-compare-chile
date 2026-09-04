import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { IntelligenceWatchEventWrite } from "@/lib/intelligence/watch-event-writer"

const MAX_BODY_LENGTH = 420

export async function createHighRelevanceWatchNotifications(
  client: SupabaseClient,
  events: IntelligenceWatchEventWrite[],
  previouslyCheckedWatchIds: Set<string>,
  createdAt: string,
) {
  const eligible = events.filter(event => event.relevance === "alta" && previouslyCheckedWatchIds.has(event.watch_id))
  if (!eligible.length) return { created: 0 }

  const rows = eligible.map(event => ({
    user_id: event.user_id,
    actor_id: null,
    case_id: null,
    kind: "intelligence_signal",
    title: event.title,
    body: truncate(event.summary, MAX_BODY_LENGTH),
    href: "/monitorear",
    read_at: null,
    created_at: createdAt,
  }))

  const { data, error } = await client
    .from("user_notifications")
    .insert(rows)
    .select("id")

  if (error) throw new Error(`Could not create intelligence notifications: ${error.message}`)
  return { created: data?.length ?? 0 }
}

function truncate(value: string | null, max: number) {
  if (!value) return null
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}
