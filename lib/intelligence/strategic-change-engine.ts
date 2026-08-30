import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { buildStrategicChangeCandidates, type StrategicSourceEvent } from "@/lib/intelligence/strategic-change-rules"

const LOOKBACK_DAYS = 31
const RELEVANT_EVENT_TYPES = ["new_record", "status_changed", "registration_added", "applicant_changed", "classification_changed"]

type SourceEventRow = {
  id: string
  source_record_id: string
  entity_type: string
  event_type: string
  title: string | null
  observed_at: string
  materiality: string
  before_snapshot: Record<string, unknown> | null
  after_snapshot: Record<string, unknown> | null
}

export type StrategicChangeRunSummary = {
  scannedEvents: number
  candidateChanges: number
  persistedChanges: number
  evidenceLinks: number
  generatedAt: string
}

export async function detectStrategicChanges(
  admin: SupabaseClient,
  referenceDate = new Date(),
): Promise<StrategicChangeRunSummary> {
  const generatedAt = referenceDate.toISOString()
  const since = new Date(referenceDate.getTime() - LOOKBACK_DAYS * 86_400_000).toISOString()
  const { data, error } = await admin
    .from("intelligence_source_events")
    .select("id,source_record_id,entity_type,event_type,title,observed_at,materiality,before_snapshot,after_snapshot")
    .eq("source_key", "inapi_open_data")
    .in("event_type", RELEVANT_EVENT_TYPES)
    .gte("observed_at", since)
    .lte("observed_at", generatedAt)
    .order("observed_at", { ascending: true })
    .limit(5000)

  if (error) throw new Error(`Could not load source events for strategic analysis: ${error.message}`)

  const events = ((data ?? []) as SourceEventRow[])
    .filter(isSupportedSourceEvent)
    .map(toStrategicSourceEvent)
  const candidates = buildStrategicChangeCandidates(events, referenceDate)

  if (!candidates.length) {
    return { scannedEvents: events.length, candidateChanges: 0, persistedChanges: 0, evidenceLinks: 0, generatedAt }
  }

  const rows = candidates.map(candidate => ({
    change_key: candidate.changeKey,
    subject_type: candidate.subjectType,
    subject_key: candidate.subjectKey,
    subject_name: candidate.subjectName,
    change_type: candidate.changeType,
    title: candidate.title,
    observed_fact: candidate.observedFact,
    interpretation: candidate.interpretation,
    why_it_matters: candidate.whyItMatters,
    materiality: candidate.materiality,
    confidence: candidate.confidence,
    event_count: candidate.eventCount,
    distinct_records: candidate.distinctRecords,
    patent_events: candidate.patentEvents,
    trademark_events: candidate.trademarkEvents,
    classification_codes: candidate.classificationCodes,
    period_start: candidate.periodStart,
    period_end: candidate.periodEnd,
    first_observed_at: candidate.firstObservedAt,
    last_observed_at: candidate.lastObservedAt,
    metadata: candidate.metadata,
    updated_at: generatedAt,
  }))

  const { data: persisted, error: persistError } = await admin
    .from("intelligence_strategic_changes")
    .upsert(rows, { onConflict: "change_key", ignoreDuplicates: false })
    .select("id,change_key")

  if (persistError) throw new Error(`Could not persist strategic changes: ${persistError.message}`)

  const idByKey = new Map((persisted ?? []).map(row => [String(row.change_key), String(row.id)]))
  const changeIds = [...idByKey.values()]
  if (changeIds.length) {
    const { error: deleteError } = await admin
      .from("intelligence_strategic_change_evidence")
      .delete()
      .in("strategic_change_id", changeIds)
    if (deleteError) throw new Error(`Could not refresh strategic change evidence: ${deleteError.message}`)
  }

  const evidenceRows = candidates.flatMap(candidate => {
    const changeId = idByKey.get(candidate.changeKey)
    if (!changeId) return []
    return candidate.evidence.map(evidence => ({
      strategic_change_id: changeId,
      source_event_id: evidence.sourceEventId,
      evidence_role: evidence.evidenceRole,
      weight: evidence.weight,
    }))
  })

  if (evidenceRows.length) {
    const { error: evidenceError } = await admin
      .from("intelligence_strategic_change_evidence")
      .insert(evidenceRows)
    if (evidenceError) throw new Error(`Could not persist strategic change evidence: ${evidenceError.message}`)
  }

  return {
    scannedEvents: events.length,
    candidateChanges: candidates.length,
    persistedChanges: persisted?.length ?? 0,
    evidenceLinks: evidenceRows.length,
    generatedAt,
  }
}

function isSupportedSourceEvent(row: SourceEventRow) {
  return (row.entity_type === "patent" || row.entity_type === "trademark")
    && Boolean(row.id)
    && Boolean(row.source_record_id)
    && Boolean(row.observed_at)
}

function toStrategicSourceEvent(row: SourceEventRow): StrategicSourceEvent {
  return {
    id: String(row.id),
    source_record_id: String(row.source_record_id),
    entity_type: row.entity_type === "trademark" ? "trademark" : "patent",
    event_type: String(row.event_type),
    title: row.title ? String(row.title) : null,
    observed_at: String(row.observed_at),
    materiality: row.materiality === "alta" || row.materiality === "media" ? row.materiality : "baja",
    before_snapshot: row.before_snapshot && typeof row.before_snapshot === "object" ? row.before_snapshot : null,
    after_snapshot: row.after_snapshot && typeof row.after_snapshot === "object" ? row.after_snapshot : null,
  }
}
