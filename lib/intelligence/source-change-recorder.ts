import "server-only"
import { createHash } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

export type SourceEntityType = "patent" | "trademark"
export type SourceChangeEventType =
  | "new_record"
  | "status_changed"
  | "registration_added"
  | "applicant_changed"
  | "classification_changed"
  | "title_changed"
  | "record_updated"

export type SourceChangeRecord = {
  sourceRecordId: string
  title: string
  searchText: string
  sourceUrl: string | null
  sourceDate: string | null
  sourceUpdatedAt: string | null
  snapshot: Record<string, unknown>
}

type ExistingState = {
  source_record_id: string
  fingerprint: string
  snapshot: Record<string, unknown> | null
  first_seen_at: string
}

type RecordBatchOptions = {
  sourceKey: string
  entityType: SourceEntityType
  dataset: string
  syncRunId: string
  baselineMode: boolean
  records: SourceChangeRecord[]
  observedAt?: string
}

export async function isChangeBaselineInitialized(
  admin: SupabaseClient,
  sourceKey: string,
  entityType: SourceEntityType,
  dataset: string,
) {
  const { data, error } = await admin
    .from("intelligence_change_baselines")
    .select("source_key")
    .eq("source_key", sourceKey)
    .eq("entity_type", entityType)
    .eq("dataset", dataset)
    .maybeSingle()

  if (error) throw new Error(`Could not inspect change baseline: ${error.message}`)
  return Boolean(data)
}

export async function markChangeBaselineCompleted(
  admin: SupabaseClient,
  sourceKey: string,
  entityType: SourceEntityType,
  dataset: string,
  syncRunId: string,
) {
  const now = new Date().toISOString()
  const { error } = await admin
    .from("intelligence_change_baselines")
    .upsert({
      source_key: sourceKey,
      entity_type: entityType,
      dataset,
      last_completed_sync_run_id: syncRunId,
      updated_at: now,
    }, { onConflict: "source_key,entity_type,dataset" })

  if (error) throw new Error(`Could not persist change baseline: ${error.message}`)
}

export async function recordSourceBatchChanges(admin: SupabaseClient, options: RecordBatchOptions) {
  if (!options.records.length) return { states: 0, changes: 0 }

  const observedAt = options.observedAt ?? new Date().toISOString()
  const recordsById = new Map<string, SourceChangeRecord>()
  for (const record of options.records) recordsById.set(record.sourceRecordId, record)
  const records = [...recordsById.values()]
  const sourceRecordIds = records.map(record => record.sourceRecordId)

  const { data: previousRows, error: previousError } = await admin
    .from("intelligence_source_states")
    .select("source_record_id,fingerprint,snapshot,first_seen_at")
    .eq("source_key", options.sourceKey)
    .eq("entity_type", options.entityType)
    .eq("dataset", options.dataset)
    .in("source_record_id", sourceRecordIds)

  if (previousError) throw new Error(`Could not load source change states: ${previousError.message}`)

  const previousById = new Map(
    ((previousRows ?? []) as ExistingState[]).map(row => [String(row.source_record_id), row]),
  )

  const events: Array<Record<string, unknown>> = []
  const states: Array<Record<string, unknown>> = []

  for (const record of records) {
    const snapshot = canonicalizeObject(record.snapshot)
    const fingerprint = fingerprintOf(snapshot)
    const previous = previousById.get(record.sourceRecordId)
    const before = previous?.snapshot ? canonicalizeObject(previous.snapshot) : null
    const changedFields = previous ? diffFields(before ?? {}, snapshot) : Object.keys(snapshot)

    if (!options.baselineMode && (!previous || previous.fingerprint !== fingerprint)) {
      const eventType = classifyChange(options.dataset, before, snapshot, changedFields)
      const materiality = materialityFor(eventType)
      events.push({
        sync_run_id: options.syncRunId,
        source_key: options.sourceKey,
        entity_type: options.entityType,
        dataset: options.dataset,
        source_record_id: record.sourceRecordId,
        event_key: eventKey(options, record.sourceRecordId, fingerprint),
        event_type: eventType,
        title: record.title,
        summary: summarizeChange(options.entityType, eventType, before, snapshot, changedFields),
        search_text: normalizeIntelligenceSearchText(record.searchText),
        source_url: record.sourceUrl,
        source_date: record.sourceDate,
        observed_at: observedAt,
        materiality,
        changed_fields: changedFields,
        before_snapshot: before,
        after_snapshot: snapshot,
        metadata: { baseline: false },
      })
    }

    states.push({
      source_key: options.sourceKey,
      entity_type: options.entityType,
      dataset: options.dataset,
      source_record_id: record.sourceRecordId,
      fingerprint,
      snapshot,
      first_seen_at: previous?.first_seen_at ?? observedAt,
      last_seen_at: observedAt,
      source_updated_at: normalizeTimestamp(record.sourceUpdatedAt),
      updated_at: observedAt,
    })
  }

  if (events.length) {
    const { error: eventError } = await admin
      .from("intelligence_source_events")
      .upsert(events, { onConflict: "event_key", ignoreDuplicates: true })
    if (eventError) throw new Error(`Could not persist source change events: ${eventError.message}`)
  }

  const { error: stateError } = await admin
    .from("intelligence_source_states")
    .upsert(states, { onConflict: "source_key,entity_type,dataset,source_record_id" })

  if (stateError) throw new Error(`Could not persist source change states: ${stateError.message}`)
  return { states: states.length, changes: events.length }
}

export function normalizeIntelligenceSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  return keys.filter(key => stableStringify(before[key]) !== stableStringify(after[key]))
}

export function classifyChange(
  dataset: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  changedFields: string[],
): SourceChangeEventType {
  if (!before) return dataset.startsWith("registros-") ? "registration_added" : "new_record"

  const registrationAdded = changedFields.includes("registration_number")
    && !cleanText(before.registration_number)
    && Boolean(cleanText(after.registration_number))
  if (registrationAdded || (changedFields.includes("registration_date") && !cleanText(before.registration_date) && Boolean(cleanText(after.registration_date)))) {
    return "registration_added"
  }
  if (changedFields.includes("status")) return "status_changed"
  if (changedFields.includes("applicant")) return "applicant_changed"
  if (changedFields.includes("classification")) return "classification_changed"
  if (changedFields.includes("title")) return "title_changed"
  return "record_updated"
}

function materialityFor(eventType: SourceChangeEventType): "alta" | "media" | "baja" {
  if (eventType === "status_changed" || eventType === "registration_added" || eventType === "applicant_changed") return "alta"
  if (eventType === "new_record" || eventType === "classification_changed") return "media"
  return "baja"
}

function summarizeChange(
  entityType: SourceEntityType,
  eventType: SourceChangeEventType,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  changedFields: string[],
) {
  const subject = entityType === "patent" ? "expediente de patente" : "expediente marcario"
  if (eventType === "new_record") return `VIDENTIA observó por primera vez este ${subject} en la fuente oficial.`
  if (eventType === "registration_added") {
    const registration = cleanText(after.registration_number)
    return registration
      ? `INAPI incorporó registro o concesión ${registration} al ${subject}.`
      : `INAPI incorporó información de registro o concesión al ${subject}.`
  }
  if (eventType === "status_changed") {
    const from = cleanText(before?.status)
    const to = cleanText(after.status)
    return from || to ? `INAPI actualizó el estado${from ? ` desde ${from}` : ""}${to ? ` a ${to}` : ""}.` : `INAPI actualizó el estado del ${subject}.`
  }
  if (eventType === "applicant_changed") return `INAPI modificó el solicitante o titular asociado al ${subject}.`
  if (eventType === "classification_changed") return `INAPI modificó la clasificación técnica o comercial asociada al ${subject}.`
  if (eventType === "title_changed") return `INAPI modificó la denominación o título del ${subject}.`
  return `INAPI actualizó ${changedFields.length} campo${changedFields.length === 1 ? "" : "s"} del ${subject}: ${changedFields.join(", ")}.`
}

function eventKey(options: RecordBatchOptions, sourceRecordId: string, fingerprint: string) {
  return `source-change:${createHash("sha256").update([
    options.syncRunId,
    options.sourceKey,
    options.entityType,
    options.dataset,
    sourceRecordId,
    fingerprint,
  ].join("|")).digest("hex")}`
}

function fingerprintOf(snapshot: Record<string, unknown>) {
  return createHash("sha256").update(stableStringify(snapshot)).digest("hex")
}

function canonicalizeObject(value: Record<string, unknown>) {
  return canonicalize(value) as Record<string, unknown>
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize).sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)))
  }
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>
    return Object.fromEntries(Object.keys(source).sort().map(key => [key, canonicalize(source[key])]))
  }
  return value ?? null
}

function stableStringify(value: unknown) {
  return JSON.stringify(canonicalize(value))
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).replace(/\s+/g, " ").trim()
  return text || null
}

function normalizeTimestamp(value: string | null) {
  if (!value) return null
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value) ? `${value.replace(" ", "T")}Z` : value
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}
