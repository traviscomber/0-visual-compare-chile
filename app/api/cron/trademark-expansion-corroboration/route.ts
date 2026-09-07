import { NextResponse } from "next/server"
import {
  CLASS_EXPANSION_PREFIX,
  buildDomainTerms,
  classifyEvidenceState,
  gatherExternalExpansionCorroboration,
  matchDomainTerms,
  matchesCompany,
  parseExpansionClasses,
  type CorroborationEvidence,
} from "@/lib/intelligence/competitive-expansion-corroboration"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

const BATCH_SIZE = 12
const PAGE_SIZE = 200
const MAX_ATTEMPTS = 3

type ExpansionEvent = {
  id: string
  user_id: string
  watch_id: string
  signal_key: string
  applicant_name: string | null
  event_date: string | null
  reason: string
}

type ExistingRun = {
  signal_event_id: string
  status: string
  attempts: number
}

type PatentRecord = {
  id: string
  source: string
  source_record_id: string
  title: string
  applicants: string | null
  filing_date: string | null
  publication_date: string | null
  source_url: string | null
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const startedAt = Date.now()
  const queue = await findRetryableExpansionEvents(admin)
  if (queue.error) return NextResponse.json({ ok: false, error: queue.error }, { status: 500 })
  if (!queue.pending.length) {
    return NextResponse.json({ ok: true, scanned: queue.scanned, queued: 0, processed: 0, durationMs: Date.now() - startedAt })
  }

  let processed = 0
  let partial = 0
  let failed = 0
  for (const { event, previous } of queue.pending) {
    const attempts = (previous?.attempts ?? 0) + 1
    const company = String(event.applicant_name ?? "").trim()
    const newNiceClasses = parseExpansionClasses(event.reason)
    const now = new Date().toISOString()

    const { error: startError } = await admin.from("trademark_expansion_corroborations").upsert({
      user_id: event.user_id,
      watch_id: event.watch_id,
      signal_event_id: event.id,
      status: "running",
      new_nice_classes: newNiceClasses,
      attempts,
      started_at: now,
      updated_at: now,
      last_error: null,
    }, { onConflict: "signal_event_id" })

    if (startError) {
      failed += 1
      console.error("[trademark-expansion-corroboration:start]", { eventId: event.id, error: startError })
      continue
    }

    try {
      if (!company || !newNiceClasses.length) throw new Error("Expansion event lacks applicant identity or structured Nice classes")
      const external = await gatherExternalExpansionCorroboration(company, newNiceClasses, event.event_date)
      const patent = await gatherLocalPatentCorroboration(admin, company, newNiceClasses, event.event_date)
      const evidence = [...external.evidence, ...patent.evidence]
      const sourceCoverage = { ...external.sourceCoverage, inapi_patents: patent.coverage }
      const evidenceState = classifyEvidenceState(evidence, sourceCoverage)
      const activityTypes = Array.from(new Set(evidence.map(item => item.activity)))
      const unavailableSources = Object.entries(sourceCoverage).filter(([, value]) => !value.available).map(([key]) => key)
      const status = unavailableSources.length ? "partial" : "completed"

      const { error: finishError } = await admin.from("trademark_expansion_corroborations").update({
        status,
        evidence_state: evidenceState,
        activity_types: activityTypes,
        evidence,
        source_coverage: sourceCoverage,
        query_context: { ...external.queryContext, signal_key: event.signal_key },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_error: unavailableSources.length ? `Fuentes no disponibles: ${unavailableSources.join(", ")}` : null,
      }).eq("signal_event_id", event.id)

      if (finishError) throw finishError
      processed += 1
      if (status === "partial") partial += 1
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : String(error)
      console.error("[trademark-expansion-corroboration:run]", { eventId: event.id, error: message })
      await admin.from("trademark_expansion_corroborations").update({
        status: "failed",
        last_error: message.slice(0, 800),
        updated_at: new Date().toISOString(),
      }).eq("signal_event_id", event.id)
    }
  }

  return NextResponse.json({
    ok: failed === 0,
    scanned: queue.scanned,
    queued: queue.pending.length,
    processed,
    partial,
    failed,
    durationMs: Date.now() - startedAt,
  }, { status: failed === queue.pending.length && queue.pending.length > 0 ? 500 : 200 })
}

async function findRetryableExpansionEvents(admin: ReturnType<typeof createAdminClient>) {
  const pending: Array<{ event: ExpansionEvent; previous: ExistingRun | null }> = []
  let offset = 0
  let scanned = 0

  while (pending.length < BATCH_SIZE) {
    const { data: eventData, error: eventError } = await admin
      .from("trademark_watch_signal_events")
      .select("id,user_id,watch_id,signal_key,applicant_name,event_date,reason")
      .eq("source", "INAPI")
      .like("reason", `${CLASS_EXPANSION_PREFIX}%`)
      .order("first_seen_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (eventError) return { pending, scanned, error: eventError.message }
    const events = (eventData ?? []) as ExpansionEvent[]
    scanned += events.length
    if (!events.length) break

    const eventIds = events.map(item => item.id)
    const { data: runData, error: runError } = await admin
      .from("trademark_expansion_corroborations")
      .select("signal_event_id,status,attempts")
      .in("signal_event_id", eventIds)

    if (runError) return { pending, scanned, error: runError.message }
    const existing = new Map(((runData ?? []) as ExistingRun[]).map(item => [item.signal_event_id, item]))

    for (const event of events) {
      const previous = existing.get(event.id) ?? null
      if (previous?.status === "completed") continue
      if ((previous?.attempts ?? 0) >= MAX_ATTEMPTS) continue
      pending.push({ event, previous })
      if (pending.length >= BATCH_SIZE) break
    }

    if (events.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return { pending, scanned, error: null as string | null }
}

async function gatherLocalPatentCorroboration(admin: ReturnType<typeof createAdminClient>, company: string, niceClasses: number[], eventDate: string | null) {
  const escaped = company.replace(/[\\%_]/g, "\\$&")
  let query = admin
    .from("patent_records")
    .select("id,source,source_record_id,title,applicants,filing_date,publication_date,source_url")
    .ilike("applicants", `%${escaped}%`)
    .order("filing_date", { ascending: false, nullsFirst: false })
    .limit(120)

  if (eventDate) {
    const from = new Date(`${eventDate}T12:00:00Z`)
    if (Number.isFinite(from.getTime())) {
      from.setUTCFullYear(from.getUTCFullYear() - 1)
      query = query.gte("filing_date", from.toISOString().slice(0, 10))
    }
  }

  const { data, error } = await query
  if (error) {
    console.warn("[trademark-expansion-corroboration] INAPI patent source unavailable", error)
    return { evidence: [] as CorroborationEvidence[], coverage: { available: false, evidence_count: 0 } }
  }

  const domainTerms = buildDomainTerms(niceClasses)
  const evidence = ((data ?? []) as PatentRecord[]).flatMap(row => {
    if (!matchesCompany(String(row.applicants ?? ""), company)) return []
    const matchedTerms = matchDomainTerms(row.title, domainTerms)
    if (!matchedTerms.length) return []
    return [{
      source: row.source === "INAPI" ? "inapi_patents" : `patent:${row.source}`,
      sourceRecordId: row.source_record_id || row.id,
      title: row.title,
      date: row.filing_date ?? row.publication_date,
      url: row.source_url,
      activity: "patent" as const,
      directness: "indirect" as const,
      matchedTerms,
    }]
  }).slice(0, 12)

  return { evidence, coverage: { available: true, evidence_count: evidence.length } }
}
