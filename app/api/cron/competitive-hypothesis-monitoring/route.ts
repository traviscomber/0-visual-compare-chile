import { NextResponse } from "next/server"
import {
  buildDomainTerms,
  gatherExternalExpansionCorroboration,
  matchDomainTerms,
  matchesCompany,
  type CorroborationEvidence,
} from "@/lib/intelligence/competitive-expansion-corroboration"
import { assessHypothesisMonitoring, classifyContradictoryTitle } from "@/lib/intelligence/competitive-hypothesis-monitoring"
import { searchGoogleNews } from "@/lib/intelligence/google-news"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

const BATCH_SIZE = 8
const DUE_AFTER_MS = 20 * 60 * 60 * 1000

type HypothesisRow = {
  id: string
  user_id: string
  status: string
  evidence_for: Array<{ source?: unknown; title?: unknown }> | null
  evidence_snapshot: Record<string, unknown> | null
  decided_at: string | null
}

type MonitoringRow = {
  hypothesis_id: string
  evidence_new: Array<{ source?: unknown; title?: unknown }> | null
  evidence_contradictory: Array<{ source?: unknown; title?: unknown }> | null
  review_status: string
  next_review_at: string | null
  observed_at: string
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
  const { data: hypothesisData, error: hypothesisError } = await admin
    .from("competitive_hypotheses")
    .select("id,user_id,status,evidence_for,evidence_snapshot,decided_at")
    .eq("status", "accepted")
    .order("decided_at", { ascending: true, nullsFirst: true })
    .limit(80)
  if (hypothesisError) return NextResponse.json({ ok: false, error: hypothesisError.message }, { status: 500 })

  const hypotheses = (hypothesisData ?? []) as HypothesisRow[]
  if (!hypotheses.length) return NextResponse.json({ ok: true, accepted: 0, due: 0, processed: 0, durationMs: Date.now() - startedAt })

  const ids = hypotheses.map(item => item.id)
  const { data: monitoringData, error: monitoringError } = await admin
    .from("competitive_hypothesis_monitoring_events")
    .select("hypothesis_id,evidence_new,evidence_contradictory,review_status,next_review_at,observed_at")
    .in("hypothesis_id", ids)
    .order("observed_at", { ascending: false })
    .limit(1200)
  if (monitoringError) return NextResponse.json({ ok: false, error: monitoringError.message }, { status: 500 })

  const historyByHypothesis = new Map<string, MonitoringRow[]>()
  for (const row of (monitoringData ?? []) as MonitoringRow[]) {
    const current = historyByHypothesis.get(row.hypothesis_id) ?? []
    current.push(row)
    historyByHypothesis.set(row.hypothesis_id, current)
  }

  const nowMs = Date.now()
  const due = hypotheses.filter(item => {
    const latest = historyByHypothesis.get(item.id)?.[0]
    return !latest || nowMs - Date.parse(latest.observed_at) >= DUE_AFTER_MS
  }).slice(0, BATCH_SIZE)

  let processed = 0
  let reviewRequired = 0
  let failed = 0

  for (const hypothesis of due) {
    try {
      const snapshot = hypothesis.evidence_snapshot ?? {}
      const signal = isObject(snapshot.signal) ? snapshot.signal : {}
      const company = cleanText(signal.applicantName) || cleanText(signal.markName)
      const niceClasses = Array.isArray(snapshot.newNiceClasses) ? snapshot.newNiceClasses.filter(value => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 45).map(Number) : []
      const eventDate = cleanText(signal.eventDate) || null
      if (!company || !niceClasses.length) throw new Error("Accepted hypothesis lacks canonical company or Nice-class snapshot")

      const external = await gatherExternalExpansionCorroboration(company, niceClasses, eventDate)
      const patent = await gatherLocalPatentEvidence(admin, company, niceClasses, hypothesis.decided_at)
      const freshEvidence = dedupe([...external.evidence, ...patent.evidence])
      const sourceCoverage = { ...external.sourceCoverage, inapi_patents: patent.coverage }
      const contradictoryEvidence = await gatherContradictoryWebEvidence(company, niceClasses, hypothesis.decided_at)
      const historical = historyByHypothesis.get(hypothesis.id) ?? []
      const baselineEvidence = [
        ...(Array.isArray(hypothesis.evidence_for) ? hypothesis.evidence_for : []),
        ...historical.flatMap(row => [...(Array.isArray(row.evidence_new) ? row.evidence_new : []), ...(Array.isArray(row.evidence_contradictory) ? row.evidence_contradictory : [])]),
      ]
      const latestReviewed = historical.find(row => (row.review_status === "reviewed" || row.review_status === "dismissed") && Boolean(row.next_review_at))
      const observedAt = new Date().toISOString()
      const assessment = assessHypothesisMonitoring({
        freshEvidence,
        contradictoryEvidence,
        baselineEvidence,
        sourceCoverage,
        acceptedAt: hypothesis.decided_at,
        nextReviewAt: latestReviewed?.next_review_at ?? null,
        observedAt,
      })
      const material = assessment.assessment !== "no_material_change"
      const { error: insertError } = await admin.from("competitive_hypothesis_monitoring_events").insert({
        user_id: hypothesis.user_id,
        hypothesis_id: hypothesis.id,
        assessment: assessment.assessment,
        summary: assessment.summary,
        evidence_new: assessment.newEvidence.slice(0, 12),
        evidence_contradictory: contradictoryEvidence.slice(0, 8),
        source_coverage: sourceCoverage,
        query_context: {
          company,
          new_nice_classes: niceClasses,
          accepted_at: hypothesis.decided_at,
          next_review_at: latestReviewed?.next_review_at ?? null,
          unavailable_sources: assessment.unavailableSources,
          age_days: assessment.ageDays,
          scheduled_review_due: assessment.scheduledReviewDue,
          external_queries: external.queryContext.queries,
        },
        review_status: material ? "pending" : "not_required",
        observed_at: observedAt,
      })
      if (insertError) throw insertError
      processed += 1
      if (material) reviewRequired += 1
    } catch (error) {
      failed += 1
      console.error("[competitive-hypothesis-monitoring]", { hypothesisId: hypothesis.id, error: error instanceof Error ? error.message : String(error) })
    }
  }

  return NextResponse.json({
    ok: failed === 0,
    accepted: hypotheses.length,
    due: due.length,
    processed,
    reviewRequired,
    failed,
    durationMs: Date.now() - startedAt,
  }, { status: failed === due.length && due.length > 0 ? 500 : 200 })
}

async function gatherContradictoryWebEvidence(company: string, niceClasses: number[], acceptedAt: string | null) {
  const domainTerms = buildDomainTerms(niceClasses)
  const compactDomain = domainTerms.slice(0, 5).join(" ") || niceClasses.map(value => `Nice ${value}`).join(" ")
  const now = new Date()
  const accepted = acceptedAt ? new Date(acceptedAt) : null
  const from = accepted && Number.isFinite(accepted.getTime()) ? new Date(Math.max(accepted.getTime() - 7 * 86400000, now.getTime() - 365 * 86400000)) : new Date(now.getTime() - 180 * 86400000)
  try {
    const rows = await searchGoogleNews(`"${company.replace(/[\u0000-\u001f"']/g, " ")}" ${compactDomain}`.trim(), from, now, 20, "global")
    return rows.flatMap(item => {
      const contradiction = classifyContradictoryTitle(item.title, company, domainTerms)
      if (!contradiction) return []
      return [{
        source: item.source,
        sourceRecordId: item.sourceRecordId,
        title: item.title,
        date: item.date,
        url: item.url,
        activity: "commercializing" as const,
        directness: "direct" as const,
        matchedTerms: contradiction.matchedTerms,
      } satisfies CorroborationEvidence]
    })
  } catch (error) {
    console.warn("[competitive-hypothesis-monitoring] contradictory web search unavailable", error)
    return [] as CorroborationEvidence[]
  }
}

async function gatherLocalPatentEvidence(admin: ReturnType<typeof createAdminClient>, company: string, niceClasses: number[], acceptedAt: string | null) {
  const escaped = company.replace(/[\\%_]/g, "\\$&")
  let query = admin.from("patent_records")
    .select("id,source,source_record_id,title,applicants,filing_date,publication_date,source_url")
    .ilike("applicants", `%${escaped}%`)
    .order("filing_date", { ascending: false, nullsFirst: false })
    .limit(120)
  if (acceptedAt) {
    const from = new Date(acceptedAt)
    if (Number.isFinite(from.getTime())) {
      from.setUTCDate(from.getUTCDate() - 30)
      query = query.gte("filing_date", from.toISOString().slice(0, 10))
    }
  }
  const { data, error } = await query
  if (error) {
    console.warn("[competitive-hypothesis-monitoring] patent source unavailable", error)
    return { evidence: [] as CorroborationEvidence[], coverage: { available: false, evidence_count: 0 } }
  }
  const domainTerms = buildDomainTerms(niceClasses)
  const evidence = ((data ?? []) as PatentRecord[]).flatMap(row => {
    if (!matchesCompany(String(row.applicants ?? ""), company)) return []
    const matchedTerms = matchDomainTerms(row.title, domainTerms)
    if (!matchedTerms.length) return []
    return [{ source: row.source === "INAPI" ? "inapi_patents" : `patent:${row.source}`, sourceRecordId: row.source_record_id || row.id, title: row.title, date: row.filing_date ?? row.publication_date, url: row.source_url, activity: "patent" as const, directness: "indirect" as const, matchedTerms }]
  }).slice(0, 12)
  return { evidence, coverage: { available: true, evidence_count: evidence.length } }
}

function dedupe(rows: CorroborationEvidence[]) {
  const seen = new Set<string>()
  return rows.filter(item => {
    const key = `${item.source.toLowerCase()}:${item.title.toLowerCase().replace(/\s+/g, " ").trim()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isObject(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function cleanText(value: unknown) { return typeof value === "string" ? value.trim().slice(0, 300) : "" }
