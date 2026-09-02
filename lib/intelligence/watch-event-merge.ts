export type IntelligenceWatchEventWrite = {
  user_id: string
  watch_id: string
  signal_key: string
  source_key: string
  event_type: string
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: string
  payload: Record<string, unknown>
  last_seen_at: string
  updated_at: string
}

export type ExistingWatchEvent = {
  user_id: string
  watch_id: string
  signal_key: string
  relevance: string
  payload: Record<string, unknown> | null
}

export function mergeIntelligenceWatchEvent(
  row: IntelligenceWatchEventWrite,
  existing?: ExistingWatchEvent,
): IntelligenceWatchEventWrite {
  if (!existing) return row

  const previousPayload = existing.payload ?? {}
  const incomingPayload = row.payload ?? {}
  const previousQuality = qualityVersion(previousPayload)
  const incomingQuality = qualityVersion(incomingPayload)
  const preservePreviousQuality = Boolean(previousQuality && !incomingQuality)

  return {
    ...row,
    relevance: preservePreviousQuality ? existing.relevance : row.relevance,
    payload: {
      ...previousPayload,
      ...incomingPayload,
      ...(preservePreviousQuality ? researchQualityFields(previousPayload) : {}),
    },
  }
}

function researchQualityFields(payload: Record<string, unknown>) {
  return {
    ...(payload.quality_version !== undefined ? { quality_version: payload.quality_version } : {}),
    ...(payload.relevance_score !== undefined ? { relevance_score: payload.relevance_score } : {}),
    ...(payload.relevance_factors !== undefined ? { relevance_factors: payload.relevance_factors } : {}),
    ...(payload.signal_kind !== undefined ? { signal_kind: payload.signal_kind } : {}),
    ...(payload.concept_matches !== undefined ? { concept_matches: payload.concept_matches } : {}),
    ...(payload.company_fit_matches !== undefined ? { company_fit_matches: payload.company_fit_matches } : {}),
    ...(payload.cluster_size !== undefined ? { cluster_size: payload.cluster_size } : {}),
    ...(payload.cluster_sources !== undefined ? { cluster_sources: payload.cluster_sources } : {}),
    ...(payload.cluster_titles !== undefined ? { cluster_titles: payload.cluster_titles } : {}),
    ...(payload.cluster_signal_keys !== undefined ? { cluster_signal_keys: payload.cluster_signal_keys } : {}),
  }
}

function qualityVersion(payload: Record<string, unknown>) {
  const value = payload.quality_version
  return typeof value === "string" && value.trim() ? value.trim() : null
}
