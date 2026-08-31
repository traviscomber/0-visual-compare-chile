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
  errorMessage?: string | null
}

type FailArgs = {
  runId: string
  sourceId: string
  error: unknown
  metadata?: Record<string, unknown>
}

type SourceState = {
  circuit_state: string | null
  circuit_open_until: string | null
}

export class IntelligenceCircuitOpenError extends Error {
  readonly runId: string
  readonly sourceId: string
  readonly openUntil: string | null

  constructor(args: { runId: string; sourceId: string; openUntil: string | null; sourceKey: string }) {
    super(`Intelligence source ${args.sourceKey} circuit is open${args.openUntil ? ` until ${args.openUntil}` : ""}.`)
    this.name = "IntelligenceCircuitOpenError"
    this.runId = args.runId
    this.sourceId = args.sourceId
    this.openUntil = args.openUntil
  }
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

  const { data: existingState, error: stateReadError } = await admin
    .from("intelligence_source_state")
    .select("circuit_state,circuit_open_until")
    .eq("source_id", source.id)
    .maybeSingle()
  if (stateReadError) throw new Error(`Could not read source circuit state: ${stateReadError.message}`)

  const state = existingState as SourceState | null
  const nowDate = new Date()
  const now = nowDate.toISOString()
  const openUntil = state?.circuit_open_until ? new Date(state.circuit_open_until) : null
  const circuitIsOpen = state?.circuit_state === "open"
  const circuitStillBlocked = circuitIsOpen && (!openUntil || openUntil.getTime() > nowDate.getTime())

  if (circuitStillBlocked) {
    const message = `Circuit open${state?.circuit_open_until ? ` until ${state.circuit_open_until}` : ""}; source call skipped.`
    const { data: blockedRun, error: blockedRunError } = await admin
      .from("intelligence_ingestion_runs")
      .insert({
        source_id: source.id,
        run_type: args.runType ?? "delta",
        status: "failed",
        scope: args.scope ?? {},
        started_at: now,
        finished_at: now,
        error_message: message,
        metadata: { observer: "videntia", contract: "grade-a-v1", blockedByCircuit: true },
      })
      .select("id")
      .single()

    if (blockedRunError || !blockedRun?.id) {
      throw new Error(`Could not record circuit-blocked ingestion run: ${blockedRunError?.message ?? "unknown"}`)
    }

    throw new IntelligenceCircuitOpenError({
      runId: String(blockedRun.id),
      sourceId: String(source.id),
      openUntil: state?.circuit_open_until ?? null,
      sourceKey: args.sourceKey,
    })
  }

  const { data: run, error: runError } = await admin
    .from("intelligence_ingestion_runs")
    .insert({
      source_id: source.id,
      run_type: args.runType ?? "delta",
      status: "running",
      scope: args.scope ?? {},
      started_at: now,
      metadata: {
        observer: "videntia",
        contract: "grade-a-v1",
        circuitProbe: circuitIsOpen,
      },
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
      circuit_state: circuitIsOpen ? "half_open" : (state?.circuit_state ?? "closed"),
      circuit_open_until: circuitIsOpen ? null : (state?.circuit_open_until ?? null),
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
  const status = args.status ?? "completed"
  const partialMessage = status === "partial"
    ? (args.errorMessage?.trim() || "Partial ingestion; review the latest run before treating this source as healthy.")
    : null

  const { error: runError } = await admin
    .from("intelligence_ingestion_runs")
    .update({
      status,
      fetched_count: nonNegative(args.fetched),
      inserted_count: nonNegative(args.inserted),
      updated_count: nonNegative(args.updated),
      rejected_count: nonNegative(args.rejected),
      finished_at: now,
      error_message: partialMessage?.slice(0, 4000) ?? null,
      metadata: args.metadata ?? {},
    })
    .eq("id", args.runId)

  if (runError) throw new Error(`Could not finish intelligence ingestion run: ${runError.message}`)

  if (status === "partial") {
    const { error: partialStateError } = await admin
      .from("intelligence_source_state")
      .upsert({
        source_id: args.sourceId,
        last_attempt_at: now,
        last_error: partialMessage?.slice(0, 4000) ?? "Partial ingestion",
        updated_at: now,
      }, { onConflict: "source_id" })

    if (partialStateError) throw new Error(`Could not publish partial source health: ${partialStateError.message}`)
    return { finishedAt: now, status }
  }

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
  return { finishedAt: now, status }
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
