import { createAdminClient } from "@/lib/supabase/admin"

export type AssistantResponseOutcome = "resolved" | "partial" | "not_resolved"
export type AssistantResponseIssueReason = "incorrect" | "missing_evidence" | "incomplete" | "misunderstood" | "needed_followup" | "other"

export type AssistantResponseQualitySummary = {
  windowDays: number
  executionSampleSize: number
  feedbackSampleSize: number
  feedbackCoverage: number
  resolvedRate: number | null
  partialRate: number | null
  notResolvedRate: number | null
  incorrectRate: number | null
  neededFollowupRate: number | null
  measuredFrom: string | null
  measuredTo: string | null
}

type FeedbackRow = {
  execution_metric_id: string
  outcome: AssistantResponseOutcome
  issue_reason: AssistantResponseIssueReason | null
  created_at: string
}

type ExecutionRow = {
  id: string
  created_at: string
}

export async function recordAssistantResponseFeedback(input: {
  userId: string
  executionMetricId: string
  outcome: AssistantResponseOutcome
  issueReason?: AssistantResponseIssueReason | null
}) {
  const admin = createAdminClient()
  const { data: metric, error: metricError } = await admin
    .from("intelligence_assistant_execution_metrics")
    .select("id")
    .eq("id", input.executionMetricId)
    .eq("user_id", input.userId)
    .maybeSingle()

  if (metricError) {
    console.warn("[assistant-response-feedback] ownership lookup failed", metricError.message)
    return { ok: false as const, reason: "lookup_failed" as const }
  }
  if (!metric) return { ok: false as const, reason: "not_found" as const }

  const issueReason = input.outcome === "resolved" ? null : input.issueReason ?? null
  const now = new Date().toISOString()
  const { error } = await admin.from("intelligence_assistant_response_feedback").upsert({
    execution_metric_id: input.executionMetricId,
    user_id: input.userId,
    outcome: input.outcome,
    issue_reason: issueReason,
    updated_at: now,
  }, { onConflict: "execution_metric_id" })

  if (error) {
    console.warn("[assistant-response-feedback] upsert failed", error.message)
    return { ok: false as const, reason: "write_failed" as const }
  }
  return { ok: true as const }
}

export async function loadAssistantResponseQualitySummary(userId: string, windowDays = 7): Promise<AssistantResponseQualitySummary> {
  const safeWindowDays = Math.max(1, Math.min(30, Math.round(windowDays)))
  const since = new Date(Date.now() - safeWindowDays * 86_400_000).toISOString()
  const admin = createAdminClient()
  const [feedbackResult, executionResult] = await Promise.all([
    admin
      .from("intelligence_assistant_response_feedback")
      .select("execution_metric_id,outcome,issue_reason,created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000),
    admin
      .from("intelligence_assistant_execution_metrics")
      .select("id,created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000),
  ])

  if (executionResult.error) {
    console.warn("[assistant-response-feedback] execution cohort failed", executionResult.error.message)
    return emptyQualitySummary(safeWindowDays, 0)
  }
  const executions = (executionResult.data ?? []) as ExecutionRow[]
  if (feedbackResult.error) {
    console.warn("[assistant-response-feedback] summary failed", feedbackResult.error.message)
    return emptyQualitySummary(safeWindowDays, executions.length)
  }

  const executionIds = new Set(executions.map(row => row.id))
  const rows = ((feedbackResult.data ?? []) as FeedbackRow[]).filter(row => executionIds.has(row.execution_metric_id))
  const feedbackCount = rows.length
  const rate = (count: number) => feedbackCount ? round2(count / feedbackCount) : null

  return {
    windowDays: safeWindowDays,
    executionSampleSize: executions.length,
    feedbackSampleSize: feedbackCount,
    feedbackCoverage: executions.length ? round2(feedbackCount / executions.length) : 0,
    resolvedRate: rate(rows.filter(row => row.outcome === "resolved").length),
    partialRate: rate(rows.filter(row => row.outcome === "partial").length),
    notResolvedRate: rate(rows.filter(row => row.outcome === "not_resolved").length),
    incorrectRate: rate(rows.filter(row => row.issue_reason === "incorrect").length),
    neededFollowupRate: rate(rows.filter(row => row.issue_reason === "needed_followup").length),
    measuredFrom: executions.length ? executions[executions.length - 1]?.created_at ?? null : null,
    measuredTo: executions[0]?.created_at ?? null,
  }
}

function emptyQualitySummary(windowDays: number, executionSampleSize: number): AssistantResponseQualitySummary {
  return {
    windowDays,
    executionSampleSize,
    feedbackSampleSize: 0,
    feedbackCoverage: 0,
    resolvedRate: null,
    partialRate: null,
    notResolvedRate: null,
    incorrectRate: null,
    neededFollowupRate: null,
    measuredFrom: null,
    measuredTo: null,
  }
}

function round2(value: number) { return Math.round(value * 100) / 100 }
