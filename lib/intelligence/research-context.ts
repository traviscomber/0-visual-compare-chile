import { createAdminClient } from "@/lib/supabase/admin"
import { normalizeResearchProfile, type ResearchProfileContext } from "@/lib/intelligence/research-quality"

type AdminClient = ReturnType<typeof createAdminClient>

type WatchWithMetadata = {
  id: string
  metadata?: unknown
}

export async function loadResearchProfilesForWatches(admin: AdminClient, watches: WatchWithMetadata[]) {
  const organizationIds = [...new Set(watches.flatMap(watch => {
    const id = organizationIdFromMetadata(watch.metadata)
    return id ? [id] : []
  }))]
  const profiles = new Map<string, ResearchProfileContext | null>()
  if (!organizationIds.length) return profiles

  const { data, error } = await admin
    .from("organization_intelligence_profiles")
    .select("organization_id,country,industry,offerings,capabilities,discovery_goals,strategic_focus")
    .in("organization_id", organizationIds)

  if (error) {
    console.warn("[research-context] profile read unavailable", error)
    return profiles
  }

  for (const row of data ?? []) {
    const organizationId = typeof row.organization_id === "string" ? row.organization_id : ""
    if (!organizationId) continue
    profiles.set(organizationId, normalizeResearchProfile(row))
  }
  return profiles
}

export function researchProfileForWatch(
  profiles: Map<string, ResearchProfileContext | null>,
  metadata: unknown,
) {
  const organizationId = organizationIdFromMetadata(metadata)
  return organizationId ? profiles.get(organizationId) ?? null : null
}

export function organizationIdFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const value = (metadata as Record<string, unknown>).organization_id
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value : null
}
