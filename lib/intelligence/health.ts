import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { runtimeSourceStatus, sourceDefinition } from "@/lib/intelligence/source-network"

export type IntelligenceHealthStatus =
  | "operational"
  | "degraded"
  | "stale"
  | "initializing"
  | "on_demand"
  | "manual"
  | "credentials_required"
  | "inactive"

export type IntelligenceHealthResult = {
  generated_at: string
  grade: "A" | "B" | "C" | "pending"
  summary: {
    operational: number
    attention: number
    on_demand: number
    manual_or_inactive: number
  }
  sources: Array<{
    key: string
    name: string
    authority: string | null
    freshness_policy: string | null
    active: boolean
    status: IntelligenceHealthStatus
    configured: boolean
    missing_credentials: string[]
    last_success_at: string | null
    last_attempt_at: string | null
    age_hours: number | null
    sla_hours: number | null
    consecutive_failures: number
    circuit_state: string | null
    last_error: string | null
    latest_run: null | {
      id: string
      status: string
      started_at: string
      finished_at: string | null
      fetched: number
      upserted: number
      changes: number
      rejected: number
      duration_ms: number | null
      validation_only: boolean
      pipeline: string | null
    }
  }>
  recent_runs: Array<{
    id: string
    source_key: string
    source_name: string
    status: string
    started_at: string
    finished_at: string | null
    fetched: number
    upserted: number
    changes: number
    rejected: number
    duration_ms: number | null
    validation_only: boolean
    pipeline: string | null
    retries: number
    failed_stage: string | null
    error_message: string | null
    reconciled: boolean | null
  }>
  quality: {
    run_id: string | null
    status: string | null
    context: string | null
    started_at: string | null
    finished_at: string | null
    checks: number
    warnings: number
    failures: number
    results: Array<{
      key: string
      category: string
      severity: string
      passed: boolean
      observed: string | null
      expected: string | null
      message: string
    }>
  }
  coverage: {
    baselines_initialized: number
    baselines_expected: 4
    persisted_source_states: number
    observed_change_events: number
    strategic_changes: number
    company_identities: number
    company_aliases: number
    company_activity_12m: number
  }
}

type SourceRow = {
  id: string
  source_key: string
  name: string
  authority: string | null
  freshness_policy: string | null
  is_active: boolean
}

type StateRow = {
  source_id: string
  last_success_at: string | null
  last_attempt_at: string | null
  consecutive_failures: number | string | null
  circuit_state: string | null
  last_error: string | null
}

type RunRow = {
  id: string
  source_id: string
  status: string
  fetched_count: number | string
  inserted_count: number | string
  updated_count: number | string
  rejected_count: number | string
  error_message: string | null
  started_at: string
  finished_at: string | null
  metadata: Record<string, unknown> | null
}

const SLA_HOURS: Record<string, number> = {
  diaria: 36,
  semanal: 24 * 9,
  mensual: 24 * 40,
}

export async function buildIntelligenceHealth(admin: SupabaseClient): Promise<IntelligenceHealthResult> {
  const now = new Date()
  const [sourcesResult, statesResult, runsResult, qualityRunResult, coverage] = await Promise.all([
    admin.from("intelligence_sources").select("id,source_key,name,authority,freshness_policy,is_active").order("source_key"),
    admin.from("intelligence_source_state").select("source_id,last_success_at,last_attempt_at,consecutive_failures,circuit_state,last_error"),
    admin.from("intelligence_ingestion_runs").select("id,source_id,status,fetched_count,inserted_count,updated_count,rejected_count,error_message,started_at,finished_at,metadata").order("started_at", { ascending: false }).limit(100),
    admin.from("intelligence_quality_runs").select("id,run_context,status,check_count,warning_count,failure_count,started_at,finished_at,metadata").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    loadCoverage(admin, now),
  ])

  if (sourcesResult.error) throw new Error(`No pudimos leer las fuentes: ${sourcesResult.error.message}`)
  if (statesResult.error) throw new Error(`No pudimos leer el estado de fuentes: ${statesResult.error.message}`)
  if (runsResult.error) throw new Error(`No pudimos leer las corridas de ingestión: ${runsResult.error.message}`)
  if (qualityRunResult.error) throw new Error(`No pudimos leer la última corrida de calidad: ${qualityRunResult.error.message}`)

  const sourceRows = (sourcesResult.data ?? []) as SourceRow[]
  const runRows = (runsResult.data ?? []) as RunRow[]
  const sourceById = new Map(sourceRows.map(row => [String(row.id), row]))
  const states = new Map(((statesResult.data ?? []) as StateRow[]).map(row => [String(row.source_id), row]))
  const latestRuns = new Map<string, RunRow>()
  for (const row of runRows) {
    const key = String(row.source_id)
    if (!latestRuns.has(key)) latestRuns.set(key, row)
  }

  const sources = sourceRows.map(source => {
    const state = states.get(String(source.id)) ?? null
    const run = latestRuns.get(String(source.id)) ?? null
    const definition = sourceDefinition(source.source_key)
    const runtime = definition ? runtimeSourceStatus(definition) : { status: "ready" as const, configured: true, missing: [] as string[] }
    const slaHours = source.freshness_policy ? SLA_HOURS[source.freshness_policy] ?? null : null
    const ageHours = state?.last_success_at ? Math.max(0, (now.getTime() - new Date(state.last_success_at).getTime()) / 3_600_000) : null

    let status: IntelligenceHealthStatus
    if (!source.is_active) status = definition?.automationPolicy === "manual_only" ? "manual" : "inactive"
    else if (runtime.status === "credentials_required") status = "credentials_required"
    else if (isOnDemandPolicy(source.freshness_policy)) status = "on_demand"
    else if (!state?.last_success_at) status = "initializing"
    else if (state.circuit_state === "open" || Number(state.consecutive_failures ?? 0) > 0 || state.last_error) status = "degraded"
    else if (slaHours !== null && ageHours !== null && ageHours > slaHours) status = "stale"
    else status = "operational"

    return {
      key: source.source_key,
      name: source.name,
      authority: source.authority,
      freshness_policy: source.freshness_policy,
      active: source.is_active,
      status,
      configured: runtime.configured,
      missing_credentials: runtime.missing,
      last_success_at: state?.last_success_at ?? null,
      last_attempt_at: state?.last_attempt_at ?? null,
      age_hours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
      sla_hours: slaHours,
      consecutive_failures: Number(state?.consecutive_failures ?? 0),
      circuit_state: state?.circuit_state ?? null,
      last_error: state?.last_error ?? null,
      latest_run: run ? summarizeRun(run) : null,
    }
  })

  const recentRuns: IntelligenceHealthResult["recent_runs"] = runRows.slice(0, 12).map(run => {
    const source = sourceById.get(String(run.source_id))
    const summary = summarizeRun(run)
    return {
      ...summary,
      source_key: source?.source_key ?? String(run.source_id),
      source_name: source?.name ?? "Fuente desconocida",
      retries: retryCount(run.metadata),
      failed_stage: metadataText(run.metadata, "failedStage"),
      error_message: run.error_message,
      reconciled: reconcileRunCounts(run),
    }
  })

  const latestQuality = qualityRunResult.data as null | {
    id: string
    run_context: string
    status: string
    check_count: number | string
    warning_count: number | string
    failure_count: number | string
    started_at: string
    finished_at: string | null
    metadata: Record<string, unknown> | null
  }
  let qualityResults: IntelligenceHealthResult["quality"]["results"] = []
  if (latestQuality?.id) {
    const { data, error } = await admin
      .from("intelligence_quality_results")
      .select("check_key,category,severity,passed,observed_value,expected_value,message")
      .eq("run_id", latestQuality.id)
      .order("passed", { ascending: true })
      .order("severity", { ascending: false })
      .order("check_key")
    if (error) throw new Error(`No pudimos leer los checks de calidad: ${error.message}`)
    qualityResults = (data ?? []).map(row => ({
      key: String(row.check_key),
      category: String(row.category),
      severity: String(row.severity),
      passed: Boolean(row.passed),
      observed: row.observed_value === null ? null : String(row.observed_value),
      expected: row.expected_value === null ? null : String(row.expected_value),
      message: String(row.message),
    }))
  }

  const grade = latestQuality
    ? normalizeGrade(latestQuality.metadata?.grade, Number(latestQuality.failure_count), Number(latestQuality.warning_count))
    : "pending"

  return {
    generated_at: now.toISOString(),
    grade,
    summary: {
      operational: sources.filter(item => item.status === "operational").length,
      attention: sources.filter(item => ["degraded", "stale", "initializing", "credentials_required"].includes(item.status)).length,
      on_demand: sources.filter(item => item.status === "on_demand").length,
      manual_or_inactive: sources.filter(item => item.status === "manual" || item.status === "inactive").length,
    },
    sources,
    recent_runs: recentRuns,
    quality: {
      run_id: latestQuality?.id ?? null,
      status: latestQuality?.status ?? null,
      context: latestQuality?.run_context ?? null,
      started_at: latestQuality?.started_at ?? null,
      finished_at: latestQuality?.finished_at ?? null,
      checks: Number(latestQuality?.check_count ?? 0),
      warnings: Number(latestQuality?.warning_count ?? 0),
      failures: Number(latestQuality?.failure_count ?? 0),
      results: qualityResults,
    },
    coverage,
  }
}

function summarizeRun(run: RunRow) {
  return {
    id: String(run.id),
    status: run.status,
    started_at: run.started_at,
    finished_at: run.finished_at,
    fetched: Number(run.fetched_count ?? 0),
    upserted: Number(run.inserted_count ?? 0),
    changes: Number(run.updated_count ?? 0),
    rejected: Number(run.rejected_count ?? 0),
    duration_ms: run.finished_at ? Math.max(0, new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) : null,
    validation_only: run.metadata?.validationOnly === true,
    pipeline: metadataText(run.metadata, "pipeline"),
  }
}

function retryCount(metadata: Record<string, unknown> | null): number {
  const retries = objectValue(metadata, "retries")
  if (!retries) return 0
  let total = 0
  for (const value of Object.values(retries)) total += Math.max(0, Number(value ?? 0) || 0)
  return total
}

function reconcileRunCounts(run: RunRow): boolean | null {
  const trademarks = objectValue(run.metadata, "trademarks")
  const patents = objectValue(run.metadata, "patents")
  if (!trademarks || !patents) return null

  const expectedFetched = numeric(trademarks.fetched) + numeric(patents.fetched)
  const expectedUpserted = numeric(trademarks.upserted) + numeric(patents.upserted)
  const expectedChanges = numeric(trademarks.changeEvents) + numeric(patents.changeEvents)

  return expectedFetched === Number(run.fetched_count ?? 0)
    && expectedUpserted === Number(run.inserted_count ?? 0)
    && expectedChanges === Number(run.updated_count ?? 0)
}

function objectValue(value: Record<string, unknown> | null, key: string) {
  const candidate = value?.[key]
  return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate as Record<string, unknown> : null
}

function metadataText(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key]
  return typeof value === "string" && value.trim() ? value : null
}

function isOnDemandPolicy(value: string | null) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[-\s]+/g, "_")
  return normalized === "bajo_demanda" || normalized === "on_demand" || normalized.startsWith("on_demand;")
}

function numeric(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

async function loadCoverage(admin: SupabaseClient, now: Date): Promise<IntelligenceHealthResult["coverage"]> {
  const yearAgo = new Date(now.getTime() - 365 * 86_400_000).toISOString().slice(0, 10)
  const [baselines, states, events, changes, identities, aliases, activity] = await Promise.all([
    count(admin, "intelligence_change_baselines", query => query.eq("source_key", "inapi_open_data")),
    count(admin, "intelligence_source_state"),
    count(admin, "intelligence_source_events"),
    count(admin, "intelligence_strategic_changes"),
    count(admin, "intelligence_company_identities"),
    count(admin, "intelligence_company_aliases"),
    count(admin, "intelligence_company_ip_activity", query => query.gte("filing_date", yearAgo)),
  ])
  return {
    baselines_initialized: baselines,
    baselines_expected: 4,
    persisted_source_states: states,
    observed_change_events: events,
    strategic_changes: changes,
    company_identities: identities,
    company_aliases: aliases,
    company_activity_12m: activity,
  }
}

async function count(
  admin: SupabaseClient,
  table: string,
  filter?: (query: any) => any,
) {
  let query = admin.from(table).select("*", { count: "exact", head: true })
  if (filter) query = filter(query)
  const { count: total, error } = await query
  if (error) throw new Error(`No pudimos contar ${table}: ${error.message}`)
  return total ?? 0
}

function normalizeGrade(value: unknown, failures: number, warnings: number): "A" | "B" | "C" {
  if (value === "A" || value === "B" || value === "C") return value
  return failures > 0 ? "C" : warnings > 0 ? "B" : "A"
}
