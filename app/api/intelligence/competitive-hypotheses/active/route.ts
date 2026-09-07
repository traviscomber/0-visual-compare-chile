import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const admin = createAdminClient()
  const { data: hypotheses, error: hypothesesError } = await admin.from("competitive_hypotheses")
    .select("id,signal_event_id,hypothesis,evidence_for,evidence_missing,evidence_against,decision_reason,decided_at,created_at")
    .eq("user_id", auth.user.id)
    .eq("status", "accepted")
    .order("decided_at", { ascending: false })
    .limit(80)
  if (hypothesesError) return NextResponse.json({ error: "No pudimos cargar las hipótesis competitivas activas." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  if (!hypotheses?.length) return NextResponse.json({ hypotheses: [], summary: { active: 0, pendingReview: 0, contradictory: 0, stale: 0 } }, { headers: PRIVATE_NO_STORE_HEADERS })

  const ids = hypotheses.map(item => item.id)
  const { data: events, error: eventsError } = await admin.from("competitive_hypothesis_monitoring_events")
    .select("id,hypothesis_id,assessment,summary,evidence_new,evidence_contradictory,source_coverage,review_status,review_reason,reviewed_at,next_review_at,observed_at")
    .eq("user_id", auth.user.id)
    .in("hypothesis_id", ids)
    .order("observed_at", { ascending: false })
    .limit(1200)
  if (eventsError) return NextResponse.json({ error: "No pudimos cargar la evolución de las hipótesis." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })

  const latest = new Map<string, Record<string, unknown>>()
  for (const row of (events ?? []) as Record<string, unknown>[]) {
    const hypothesisId = String(row.hypothesis_id ?? "")
    if (hypothesisId && !latest.has(hypothesisId)) latest.set(hypothesisId, row)
  }
  const normalized = hypotheses.map(row => ({
    id: row.id,
    signalEventId: row.signal_event_id,
    hypothesis: row.hypothesis,
    evidenceFor: Array.isArray(row.evidence_for) ? row.evidence_for.slice(0, 8) : [],
    evidenceMissing: Array.isArray(row.evidence_missing) ? row.evidence_missing.filter(value => typeof value === "string").slice(0, 8) : [],
    evidenceAgainst: Array.isArray(row.evidence_against) ? row.evidence_against.filter(value => typeof value === "string").slice(0, 8) : [],
    decisionReason: row.decision_reason,
    decidedAt: row.decided_at,
    latestMonitoring: latest.has(row.id) ? normalizeEvent(latest.get(row.id)!) : null,
  }))
  return NextResponse.json({
    hypotheses: normalized,
    summary: {
      active: normalized.length,
      pendingReview: normalized.filter(item => item.latestMonitoring?.reviewStatus === "pending").length,
      contradictory: normalized.filter(item => item.latestMonitoring?.assessment === "contradictory_signal").length,
      stale: normalized.filter(item => item.latestMonitoring?.assessment === "stale_review_due").length,
    },
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function normalizeEvent(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    assessment: String(row.assessment ?? "no_material_change"),
    summary: String(row.summary ?? ""),
    evidenceNew: Array.isArray(row.evidence_new) ? row.evidence_new.slice(0, 12) : [],
    evidenceContradictory: Array.isArray(row.evidence_contradictory) ? row.evidence_contradictory.slice(0, 8) : [],
    sourceCoverage: row.source_coverage && typeof row.source_coverage === "object" ? row.source_coverage : {},
    reviewStatus: String(row.review_status ?? "pending"),
    reviewReason: typeof row.review_reason === "string" ? row.review_reason : null,
    reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    nextReviewAt: typeof row.next_review_at === "string" ? row.next_review_at : null,
    observedAt: typeof row.observed_at === "string" ? row.observed_at : null,
  }
}
