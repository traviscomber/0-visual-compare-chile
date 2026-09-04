import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { buildCompanyTrajectoryAnalysis } from "@/lib/intelligence/company-trajectory"
import type { StrategicWatch } from "@/lib/intelligence/strategic-watch-scanner"

type WatchSignal = {
  signal_key: string
  source_key: "videntia_trajectory"
  event_type: "trajectory"
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: "alta" | "media" | "baja"
  payload: Record<string, unknown>
}

export async function scanCompanyTrajectoryWatch(
  admin: SupabaseClient,
  watch: StrategicWatch,
): Promise<WatchSignal[]> {
  const watchType = effectiveWatchType(watch)
  if (watchType !== "company" && watchType !== "competitor") return []

  const query = watch.query.trim()
  if (!query) return []

  const { data, error } = await admin
    .from("intelligence_company_identities")
    .select("id,canonical_name,country,resolution_confidence")
    .ilike("canonical_name", query)
    .limit(2)

  if (error) throw error
  if (!data || data.length !== 1) return []

  const identity = data[0]
  const canonicalName = String(identity.canonical_name ?? "").trim()
  if (!canonicalName || canonicalName.localeCompare(query, undefined, { sensitivity: "base" }) !== 0) return []

  const analysis = await buildCompanyTrajectoryAnalysis(admin, String(identity.id))
  const direction = analysis.trajectory.direction
  if (!direction) return []

  const currentQuarter = analysis.trajectory.quarters[0]
  const topTechnical = [
    ...analysis.trajectory.technical.emerging,
    ...analysis.trajectory.technical.accelerating,
    ...analysis.trajectory.technical.persistent,
  ].slice(0, 5)
  const topCommercial = [
    ...analysis.trajectory.commercial.emerging,
    ...analysis.trajectory.commercial.accelerating,
    ...analysis.trajectory.commercial.persistent,
  ].slice(0, 5)

  const fingerprint = [
    direction.headline,
    currentQuarter.patents,
    currentQuarter.trademarks,
    ...topTechnical.map(item => `${item.state}:${item.code}:${item.current}`),
    ...topCommercial.map(item => `${item.state}:${item.code}:${item.current}`),
  ].join("|")

  return [{
    signal_key: `videntia_trajectory:trajectory:${identity.id}:${stableKey(fingerprint)}`,
    source_key: "videntia_trajectory",
    event_type: "trajectory",
    title: direction.headline,
    summary: `${direction.observed_fact} ${direction.interpretation}`.trim(),
    source_url: null,
    occurred_at: analysis.generated_at,
    relevance: direction.evidence_level === "alta" ? "alta" : direction.evidence_level === "media" ? "media" : "baja",
    payload: {
      derived_signal: true,
      official_source: false,
      identity_id: identity.id,
      canonical_name: canonicalName,
      country: identity.country,
      resolution_confidence: Number(identity.resolution_confidence ?? 0),
      trajectory_window_days: analysis.trajectory.window_days,
      current_quarter: currentQuarter,
      technical: topTechnical,
      commercial: topCommercial,
      confidence: direction.confidence,
      evidence_level: direction.evidence_level,
      why_it_matters: direction.why_it_matters,
      guardrail: direction.guardrail,
      search_scope: "derived_from_verified_ip_activity",
    },
  }]
}

function effectiveWatchType(watch: StrategicWatch) {
  if (watch.metadata && typeof watch.metadata === "object" && !Array.isArray(watch.metadata)) {
    const external = (watch.metadata as Record<string, unknown>).external_watch_type
    if (typeof external === "string" && external) return external
  }
  return watch.watch_type
}

function stableKey(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}
