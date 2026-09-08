import { createAdminClient } from "@/lib/supabase/admin"

export type AssistantExecutionMetricInput = {
  userId: string
  mode: "direct" | "canonical_lookup" | "agentic_research"
  reason: string
  workspace: string
  canonicalContextAvailable: boolean
  requiresFreshExternalEvidence: boolean
  durationMs: number
  toolCalls: number
  actionProposalCount: number
  responseCharacters: number
  inputMessageCount: number
  injectedContextMessageCount: number
  model: string
  usageAvailable: boolean
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
  cachedInputTokens: number | null
}

type MetricRow = {
  mode: AssistantExecutionMetricInput["mode"]
  duration_ms: number
  tool_calls: number
  total_tokens: number | null
  usage_available: boolean
  created_at: string
}

export type AssistantExecutionModeSummary = {
  mode: AssistantExecutionMetricInput["mode"]
  requests: number
  p50DurationMs: number | null
  p95DurationMs: number | null
  averageToolCalls: number | null
  averageTotalTokens: number | null
}

export type AssistantExecutionMetricsSummary = {
  windowDays: number
  sampleSize: number
  measuredFrom: string | null
  measuredTo: string | null
  p50DurationMs: number | null
  p95DurationMs: number | null
  averageToolCalls: number | null
  averageTotalTokens: number | null
  usageCoverage: number
  modes: AssistantExecutionModeSummary[]
}

const MODES: AssistantExecutionMetricInput["mode"][] = ["direct", "canonical_lookup", "agentic_research"]

export async function recordAssistantExecutionMetric(input: AssistantExecutionMetricInput): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from("intelligence_assistant_execution_metrics").insert({
    user_id: input.userId,
    mode: input.mode,
    reason: input.reason.slice(0, 160),
    workspace: input.workspace.slice(0, 160),
    canonical_context_available: input.canonicalContextAvailable,
    requires_fresh_external_evidence: input.requiresFreshExternalEvidence,
    duration_ms: boundedInteger(input.durationMs, 0, 120_000),
    tool_calls: boundedInteger(input.toolCalls, 0, 64),
    action_proposal_count: boundedInteger(input.actionProposalCount, 0, 64),
    response_characters: Math.max(0, Math.round(input.responseCharacters)),
    input_message_count: boundedInteger(input.inputMessageCount, 0, 64),
    injected_context_message_count: boundedInteger(input.injectedContextMessageCount, 0, 16),
    model: input.model.slice(0, 120),
    usage_available: input.usageAvailable,
    input_tokens: nullableNonNegativeInteger(input.inputTokens),
    output_tokens: nullableNonNegativeInteger(input.outputTokens),
    total_tokens: nullableNonNegativeInteger(input.totalTokens),
    cached_input_tokens: nullableNonNegativeInteger(input.cachedInputTokens),
  }).select("id").single()
  if (error) {
    console.warn("[assistant-execution-metrics] insert failed", error.message)
    return null
  }
  return typeof data?.id === "string" ? data.id : null
}

export async function loadAssistantExecutionMetricsSummary(userId: string, windowDays = 7): Promise<AssistantExecutionMetricsSummary> {
  const safeWindowDays = Math.max(1, Math.min(30, Math.round(windowDays)))
  const since = new Date(Date.now() - safeWindowDays * 86_400_000).toISOString()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("intelligence_assistant_execution_metrics")
    .select("mode,duration_ms,tool_calls,total_tokens,usage_available,created_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1000)

  if (error) {
    console.warn("[assistant-execution-metrics] summary failed", error.message)
    return emptySummary(safeWindowDays)
  }

  const rows = (data ?? []) as MetricRow[]
  const durations = rows.map(row => row.duration_ms)
  const toolCalls = rows.map(row => row.tool_calls)
  const tokens = rows.flatMap(row => typeof row.total_tokens === "number" ? [row.total_tokens] : [])

  return {
    windowDays: safeWindowDays,
    sampleSize: rows.length,
    measuredFrom: rows.length ? rows[rows.length - 1]?.created_at ?? null : null,
    measuredTo: rows[0]?.created_at ?? null,
    p50DurationMs: percentile(durations, 0.5),
    p95DurationMs: percentile(durations, 0.95),
    averageToolCalls: average(toolCalls),
    averageTotalTokens: average(tokens),
    usageCoverage: rows.length ? round2(rows.filter(row => row.usage_available).length / rows.length) : 0,
    modes: MODES.map(mode => {
      const selected = rows.filter(row => row.mode === mode)
      const selectedTokens = selected.flatMap(row => typeof row.total_tokens === "number" ? [row.total_tokens] : [])
      return {
        mode,
        requests: selected.length,
        p50DurationMs: percentile(selected.map(row => row.duration_ms), 0.5),
        p95DurationMs: percentile(selected.map(row => row.duration_ms), 0.95),
        averageToolCalls: average(selected.map(row => row.tool_calls)),
        averageTotalTokens: average(selectedTokens),
      }
    }),
  }
}

function emptySummary(windowDays: number): AssistantExecutionMetricsSummary {
  return {
    windowDays,
    sampleSize: 0,
    measuredFrom: null,
    measuredTo: null,
    p50DurationMs: null,
    p95DurationMs: null,
    averageToolCalls: null,
    averageTotalTokens: null,
    usageCoverage: 0,
    modes: MODES.map(mode => ({ mode, requests: 0, p50DurationMs: null, p95DurationMs: null, averageToolCalls: null, averageTotalTokens: null })),
  }
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(ratio * sorted.length) - 1))
  return sorted[index] ?? null
}

function average(values: number[]) {
  if (!values.length) return null
  return round2(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function round2(value: number) { return Math.round(value * 100) / 100 }
function boundedInteger(value: number, min: number, max: number) { return Math.max(min, Math.min(max, Math.round(value))) }
function nullableNonNegativeInteger(value: number | null) { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : null }
