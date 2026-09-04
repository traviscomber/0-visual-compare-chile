import "server-only"
import { resolveCanonicalCompanyWatchIdentity } from "@/lib/intelligence/company-watch-identity"
import { refreshCmfOwnerSignal } from "@/lib/intelligence/cmf"
import { createAdminClient } from "@/lib/supabase/admin"

export type CmfCompanySignal = {
  signal_key: string
  source_key: "cmf"
  event_type: "regulatory_status"
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: "alta" | "media" | "baja"
  payload: Record<string, unknown>
}

type AdminClient = ReturnType<typeof createAdminClient>
type WatchLike = {
  query: string
  watch_type: string
  metadata?: unknown
}

export async function scanCmfCompanyWatch(admin: AdminClient, watch: WatchLike): Promise<CmfCompanySignal[]> {
  if (!isCompanyWatch(watch)) return []

  const company = await resolveCanonicalCompanyWatchIdentity(admin, watch)
  if (!company?.rut) return []
  const rut = company.rut

  const refreshed = await refreshCmfOwnerSignal(company.id, rut)
  if (!refreshed.matched) return []

  const { data: links, error: linksError } = await admin
    .from("intelligence_entity_evidence")
    .select("evidence_id")
    .eq("entity_id", company.id)
    .eq("role", "regulated_entity")

  if (linksError) throw linksError
  const evidenceIds = (links ?? []).map(row => row.evidence_id).filter(Boolean)
  if (!evidenceIds.length) return []

  const { data: evidence, error: evidenceError } = await admin
    .from("intelligence_evidence")
    .select("id,source_record_id,title,summary,source_url,occurred_at,observed_at,payload,confidence")
    .in("id", evidenceIds)
    .eq("evidence_type", "regulatory_status")
    .order("observed_at", { ascending: false })
    .limit(6)

  if (evidenceError) throw evidenceError

  return (evidence ?? []).map(row => ({
    signal_key: `cmf:regulatory_status:${row.source_record_id || row.id}`,
    source_key: "cmf" as const,
    event_type: "regulatory_status" as const,
    title: row.title || `CMF · ${company.canonicalName}`,
    summary: row.summary || `La CMF registra evidencia pública para el RUT verificado ${rut}.`,
    source_url: row.source_url,
    occurred_at: row.occurred_at || row.observed_at,
    relevance: "alta" as const,
    payload: {
      official_source: true,
      source_record_id: row.source_record_id,
      canonical_company_id: company.id,
      canonical_company_name: company.canonicalName,
      verified_rut: rut,
      confidence: row.confidence,
      watch_match_basis: company.matchBasis === "canonical_entity_id"
        ? "canonical_entity_id_plus_verified_rut"
        : "exact_canonical_name_plus_verified_rut",
      cmf: row.payload,
      search_scope: "chile",
    },
  }))
}

function isCompanyWatch(watch: WatchLike) {
  if (watch.metadata && typeof watch.metadata === "object" && !Array.isArray(watch.metadata)) {
    const external = (watch.metadata as Record<string, unknown>).external_watch_type
    if (external === "company" || external === "competitor") return true
    if (typeof external === "string") return false
  }
  return watch.watch_type === "company" || watch.watch_type === "competitor"
}
