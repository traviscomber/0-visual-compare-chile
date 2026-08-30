import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

type StartArgs = {
  sourceKey: string
  runType?: "full" | "delta" | "on_demand" | "reconcile"
  scope?: Record<string, unknown>
}

type FinishArgs = {
  runId: string
  sourceId: string
  fetched?: number
  inserted?: number
  updated?: number
  rejected?: number
  metadata?: Record<string, unknown>
  status?: "completed" | "partial"
}

type FailArgs = {
  runId: string
  sourceId: string
  error: unknown
  metadata?: Record<string, unknown>
}

export async function startIntelligenceIngestion(admin: SupabaseClient, args: StartArgs) {
  const { data: source, error: sourceError } = await admin
    .from("intelligence_sources")
    .select("id,source_key")
    .eq("source_key", args.sourceKey)
    .single()

  if (sourceError || !source?.id) {
    throw new Error(`Intelligence source ${args.sourceKey} is not registered: ${sourceError?.message ?? "missing source"}`)
  }

  const now = new Date().toISOString()
  const { data: run, error: runError } = await admin
    .from("intelligence_ingestion_runs")
    .insert({
      source_id: source.id,
      run_type: args.runType ?? "delta",
      status: "running",
      scope: args.scope ?? {},
      started_at: now,
      metadata: { observer: "videntia", contract: "grade-a-v1" },
    })
    .select("id")
    .single()

  if (runError || !run?.id) {
    throw new Error(`Could not start intelligence ingestion run: ${runError?.message ?? "unknown"}`)
  }

  const { error: stateError } = await admin
    .from("intelligence_source_state")
    .upsert({
      source_id: source.id,
      last_attempt_at: now,
      updated_at: now,
    }, { onConflict: "source_id" })

  if (stateError) {
    await admin.from("intelligence_ingestion_runs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: `Could not update source state: ${stateError.message}`,
    }).eq("id", run.id)
    throw new Error(`Could not update source state: ${stateError.message}`)
  }

  return { runId: String(run.id), sourceId: String(source.id), startedAt: now }
}

export async function finishIntelligenceIngestion(admin: SupabaseClient, args: FinishArgs) {
  const now = new Date().toISOString()
  const { error: runError } = await admin
    .from("intelligence_ingestion_runs")
    .update({
      status: args.status ?? "completed",
      fetched_count: nonNegative(args.fetched),
      inserted_count: nonNegative(args.inserted),
      updated_count: nonNegative(args.updated),
      rejected_count: nonNegative(args.rejected),
      finished_at: now,
      error_message: null,
      metadata: args.metadata ?? {},
    })
    .eq("id", args.runId)

  if (runError) throw new Error(`Could not finish intelligence ingestion run: ${runError.message}`)

  const { error: stateError } = await admin
    .from("intelligence_source_state")
    .upsert({
      source_id: args.sourceId,
      last_success_at: now,
      last_attempt_at: now,
      consecutive_failures: 0,
      circuit_state: "closed",
      circuit_open_until: null,
      last_error: null,
      updated_at: now,
    }, { onConflict: "source_id" })

  if (stateError) throw new Error(`Could not publish source health: ${stateError.message}`)
  return { finishedAt: now }
}

export async function failIntelligenceIngestion(admin: SupabaseClient, args: FailArgs) {
  const now = new Date().toISOString()
  const message = args.error instanceof Error ? args.error.message : String(args.error)

  await admin.from("intelligence_ingestion_runs").update({
    status: "failed",
    finished_at: now,
    error_message: message.slice(0, 4000),
    metadata: args.metadata ?? {},
  }).eq("id", args.runId)

  const { data: state } = await admin
    .from("intelligence_source_state")
    .select("consecutive_failures")
    .eq("source_id", args.sourceId)
    .maybeSingle()

  const failures = Math.max(0, Number(state?.consecutive_failures ?? 0)) + 1
  const open = failures >= 3
  await admin.from("intelligence_source_state").upsert({
    source_id: args.sourceId,
    last_attempt_at: now,
    consecutive_failures: failures,
    circuit_state: open ? "open" : "closed",
    circuit_open_until: open ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null,
    last_error: message.slice(0, 4000),
    updated_at: now,
  }, { onConflict: "source_id" })

  return { failures, circuitState: open ? "open" as const : "closed" as const }
}

function nonNegative(value: number | undefined) {
  return Math.max(0, Math.trunc(Number(value ?? 0)))
}
