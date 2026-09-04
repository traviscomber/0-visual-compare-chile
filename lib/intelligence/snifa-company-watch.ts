import "server-only"

import { resolveCanonicalCompanyWatchIdentity, normalizeCompanyName } from "@/lib/intelligence/company-watch-identity"
import { searchSnifaRecentCompliancePrograms } from "@/lib/intelligence/snifa-compliance-programs"
import { searchSnifaEntryRequirements } from "@/lib/intelligence/snifa-entry-requirements"
import { searchSnifaFirmSanctions } from "@/lib/intelligence/snifa-firm-sanctions"
import { searchSnifaProvisionalMeasures } from "@/lib/intelligence/snifa-provisional-measures"
import { searchSnifaActiveSanctioningProceedings } from "@/lib/intelligence/snifa-sanctioning-proceedings"
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

  const [sanctions, compliancePrograms, activeProceedings, provisionalMeasures, entryRequirements] = await Promise.all([
    searchSnifaFirmSanctions(canonicalName, 12),
    searchSnifaRecentCompliancePrograms(canonicalName, 12),
    searchSnifaActiveSanctioningProceedings(canonicalName, 12),
    searchSnifaProvisionalMeasures(canonicalName, 12),
    searchSnifaEntryRequirements(canonicalName, 12),
  ])

  const sanctionSignals = sanctions
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
        regulatory_stage: "firm_sanction",
        early_warning: false,
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

  const proceedingSignals = activeProceedings
    .filter(item => normalizeCompanyName(item.holderName).includes(normalizedCanonicalName))
    .map(item => ({
      signal_key: `snifa_sma:sanctioning_proceeding:${item.sourceRecordId}`,
      source_key: "snifa_sma" as const,
      event_type: "regulation" as const,
      title: `Procedimiento sancionatorio SMA en curso · ${item.expediente}`,
      summary: [
        item.status,
        item.infringementCount ? `${item.infringementCount} hecho(s)` : null,
        item.gravisimaCount ? `${item.gravisimaCount} gravísima(s)` : null,
        item.graveCount ? `${item.graveCount} grave(s)` : null,
        item.unitName,
        item.region,
      ].filter(Boolean).join(" · "),
      source_url: item.sourceUrl,
      occurred_at: item.latestActivityAt || item.startedAt,
      relevance: "alta" as const,
      payload: {
        official_source: true,
        evidence_type: "sanctioning_proceeding",
        regulatory_stage: "sanctioning_proceeding",
        early_warning: true,
        proceeding_active: true,
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
        status: item.status,
        started_at: item.startedAt,
        latest_activity_at: item.latestActivityAt,
        infringement_count: item.infringementCount,
        gravisima_count: item.gravisimaCount,
        grave_count: item.graveCount,
        leve_count: item.leveCount,
        coverage: "snifa_visible_active_sanctioning_results",
        derived_materiality: false,
        search_scope: "chile",
      },
    }))

  const provisionalMeasureSignals = provisionalMeasures
    .filter(item => normalizeCompanyName(item.holderName).includes(normalizedCanonicalName))
    .map(item => ({
      signal_key: `snifa_sma:provisional_measure:${item.sourceRecordId}`,
      source_key: "snifa_sma" as const,
      event_type: "regulation" as const,
      title: `Medida provisional SMA · ${item.expediente}`,
      summary: [item.status, item.unitName, item.region, item.associatedProceedings ? `${item.associatedProceedings} sancionatorio(s) asociado(s)` : null].filter(Boolean).join(" · "),
      source_url: item.sourceUrl,
      occurred_at: item.startedAt || item.createdAt || item.latestActivityAt,
      relevance: "alta" as const,
      payload: {
        official_source: true,
        evidence_type: "provisional_measure",
        regulatory_stage: "provisional_measure",
        early_warning: true,
        urgency_basis: "sma_environment_or_health_protection_measure",
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
        status: item.status,
        created_at: item.createdAt,
        started_at: item.startedAt,
        latest_activity_at: item.latestActivityAt,
        associated_proceedings: item.associatedProceedings,
        coverage: "snifa_visible_provisional_measure_results",
        derived_materiality: false,
        search_scope: "chile",
      },
    }))

  const entryRequirementSignals = entryRequirements
    .filter(item => normalizeCompanyName(item.holderName).includes(normalizedCanonicalName))
    .map(item => ({
      signal_key: `snifa_sma:entry_requirement:${item.sourceRecordId}`,
      source_key: "snifa_sma" as const,
      event_type: "regulation" as const,
      title: `Requerimiento de ingreso al SEIA · ${item.expediente}`,
      summary: [
        item.unitName,
        item.region,
        item.fiscalizationCount ? `${item.fiscalizationCount} fiscalización(es) asociada(s)` : null,
        item.associatedProceedings ? `${item.associatedProceedings} sancionatorio(s) asociado(s)` : null,
      ].filter(Boolean).join(" · "),
      source_url: item.sourceUrl,
      occurred_at: item.latestActivityAt || item.startedAt,
      relevance: "alta" as const,
      payload: {
        official_source: true,
        evidence_type: "entry_requirement",
        regulatory_stage: "seia_entry_requirement",
        early_warning: true,
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
        started_at: item.startedAt,
        latest_activity_at: item.latestActivityAt,
        fiscalization_count: item.fiscalizationCount,
        associated_proceedings: item.associatedProceedings,
        coverage: "snifa_visible_entry_requirement_results",
        derived_materiality: false,
        search_scope: "chile",
      },
    }))

  const complianceSignals = compliancePrograms
    .filter(item => normalizeCompanyName(item.holderName).includes(normalizedCanonicalName))
    .map(item => ({
      signal_key: `snifa_sma:compliance_program:${item.sourceRecordId}`,
      source_key: "snifa_sma" as const,
      event_type: "regulation" as const,
      title: `Programa de Cumplimiento SMA · ${item.expediente}`,
      summary: [item.status, item.unitName, item.region, item.resolutionDate ? `Resuelto ${formatDate(item.resolutionDate)}` : null].filter(Boolean).join(" · "),
      source_url: item.sourceUrl,
      occurred_at: item.resolutionDate,
      relevance: "alta" as const,
      payload: {
        official_source: true,
        evidence_type: "compliance_program",
        regulatory_stage: "compliance_program",
        early_warning: true,
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
        resolution_date: item.resolutionDate,
        end_date: item.endDate,
        reporting_frequency: item.reportingFrequency,
        status: item.status,
        program_type: item.programType,
        coverage: "snifa_visible_compliance_program_results",
        derived_materiality: false,
        search_scope: "chile",
      },
    }))

  return dedupeSignals([...entryRequirementSignals, ...provisionalMeasureSignals, ...proceedingSignals, ...complianceSignals, ...sanctionSignals])
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

function dedupeSignals(signals: SnifaCompanySignal[]) {
  const map = new Map<string, SnifaCompanySignal>()
  for (const signal of signals) map.set(signal.signal_key, signal)
  return [...map.values()]
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}
