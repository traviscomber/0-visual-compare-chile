import "server-only"

import { resolveCanonicalCompanyWatchIdentity, normalizeCompanyName } from "@/lib/intelligence/company-watch-identity"
import { searchSnifaFirmSanctions } from "@/lib/intelligence/snifa-firm-sanctions"
import { createAdminClient } from "@/lib/supabase/admin"

type AdminClient = ReturnType<typeof createAdminClient>
type WatchLike = {
  query: string
  watch_type: string
  metadata?: unknown
}

export type SnifaCompanySignal = {
  signal_key: string
  source_key: "snifa_sma"
  event_type: "regulation"
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: "alta" | "media" | "baja"
  payload: Record<string, unknown>
}

export async function scanSnifaCompanyWatch(admin: AdminClient, watch: WatchLike): Promise<SnifaCompanySignal[]> {
  if (!isCompanyWatch(watch)) return []

  const identity = await resolveCanonicalCompanyWatchIdentity(admin, watch)
  if (!identity?.rut) return []

  const canonicalName = identity.canonicalName
  const normalizedCanonicalName = normalizeCompanyName(canonicalName)
  if (!normalizedCanonicalName) return []

  const items = await searchSnifaFirmSanctions(canonicalName, 12)
  return items
    .filter(item => normalizeCompanyName(item.holderName).includes(normalizedCanonicalName))
    .map(item => ({
      signal_key: `snifa_sma:firm_sanction:${item.sourceRecordId}`,
      source_key: "snifa_sma" as const,
      event_type: "regulation" as const,
      title: `Sanción SMA firme · ${item.expediente}`,
      summary: [
        `Riesgo ${item.environmentalRiskLevel}`,
        item.infringementCount ? `${item.infringementCount} hecho(s)` : null,
        item.unitName,
        item.fineUta != null ? `${item.fineUta.toLocaleString("es-CL")} UTA` : null,
        item.paymentStatus,
        item.region,
      ].filter(Boolean).join(" · "),
      source_url: item.sourceUrl,
      occurred_at: item.endedAt || item.startedAt,
      relevance: riskRelevance(item.environmentalRiskLevel),
      payload: {
        official_source: true,
        evidence_type: "firm_sanction",
        source_record_id: item.sourceRecordId,
        canonical_company_id: identity.id,
        canonical_company_name: canonicalName,
        verified_rut: identity.rut,
        watch_match_basis: identity.matchBasis,
        source_holder_match_basis: "canonical_company_name_in_official_holder",
        expediente: item.expediente,
        fiscalizable_unit: item.unitName,
        holder_name: item.holderName,
        category: item.category,
        region: item.region,
        fine_uta: item.fineUta,
        payment_status: item.paymentStatus,
        started_at: item.startedAt,
        ended_at: item.endedAt,
        status: item.status,
        environmental_risk_level: item.environmentalRiskLevel,
        environmental_risk_basis: item.environmentalRiskBasis,
        infringement_count: item.infringementCount,
        gravisima_count: item.gravisimaCount,
        grave_count: item.graveCount,
        leve_count: item.leveCount,
        derived_materiality: true,
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

function riskRelevance(level: string): "alta" | "media" | "baja" {
  if (level === "critical" || level === "high") return "alta"
  if (level === "medium") return "media"
  return "baja"
}
