import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

type AdminClient = ReturnType<typeof createAdminClient>

type WatchLike = {
  query: string
  metadata?: unknown
}

export type CanonicalCompanyIdentity = {
  id: string
  canonicalName: string
  normalizedName: string
  rut: string | null
  matchBasis: "canonical_entity_id" | "exact_normalized_name"
}

export async function resolveCanonicalCompanyWatchIdentity(
  admin: AdminClient,
  watch: WatchLike,
): Promise<CanonicalCompanyIdentity | null> {
  const metadataId = readCanonicalEntityId(watch.metadata)
  if (metadataId) {
    const { data, error } = await admin
      .from("intelligence_entities")
      .select("id,canonical_name,normalized_name,rut,entity_type")
      .eq("id", metadataId)
      .eq("entity_type", "company")
      .maybeSingle()

    if (error) throw error
    if (data) return normalizeIdentity(data, "canonical_entity_id")
    return null
  }

  const normalizedQuery = normalizeCompanyName(watch.query)
  if (!normalizedQuery) return null

  const { data, error } = await admin
    .from("intelligence_entities")
    .select("id,canonical_name,normalized_name,rut")
    .eq("entity_type", "company")
    .eq("normalized_name", normalizedQuery)
    .limit(2)

  if (error) throw error
  if (!data || data.length !== 1) return null
  return normalizeIdentity(data[0], "exact_normalized_name")
}

export function readCanonicalEntityId(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const value = (metadata as Record<string, unknown>).canonical_entity_id
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null
}

export function normalizeCompanyName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function normalizeIdentity(row: Record<string, unknown>, matchBasis: CanonicalCompanyIdentity["matchBasis"]): CanonicalCompanyIdentity | null {
  const id = typeof row.id === "string" ? row.id : ""
  const canonicalName = typeof row.canonical_name === "string" ? row.canonical_name.trim() : ""
  const normalizedName = typeof row.normalized_name === "string" && row.normalized_name.trim()
    ? row.normalized_name.trim()
    : normalizeCompanyName(canonicalName)
  if (!id || !canonicalName || !normalizedName) return null
  const rut = typeof row.rut === "string" && row.rut.trim() ? row.rut.trim() : null
  return { id, canonicalName, normalizedName, rut, matchBasis }
}
