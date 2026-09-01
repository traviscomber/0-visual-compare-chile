import { NextResponse } from "next/server"
import { syncCurrentYearInapiOpenData } from "@/lib/inapi/open-data-sync"
import { syncCurrentYearPatentOpenData, syncNextPatentHistoryBatch } from "@/lib/inapi/patent-open-data-sync"
import { withSourceRetry } from "@/lib/intelligence/fetch-with-retry"
import { detectStrategicChanges } from "@/lib/intelligence/strategic-change-engine"
import {
  failIntelligenceIngestion,
  finishIntelligenceIngestion,
  IntelligenceCircuitOpenError,
  startIntelligenceIngestion,
} from "@/lib/intelligence/ingestion-observability"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const COMPANY_ACTIVITY_BATCH_LIMIT = 500
const COMPANY_ACTIVITY_MAX_BATCHES = 24

type IngestionHandle = Awaited<ReturnType<typeof startIntelligenceIngestion>>

type RunCounts = {
  fetched: number
  inserted: number
  updated: number
  rejected: number
}

type CompanyActivityBatch = Record<string, unknown> & {
  done?: boolean
  batch_records?: number
  identity_upserts?: number
  alias_upserts?: number
  activity_upserts?: number
  reviews_pending?: number
  window_start?: string
  window_end?: string
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  let ingestion: IngestionHandle | null = null
  let ingestionFinalized = false
  let coreSyncCompleted = false
  let stage = "starting"
  let counts: RunCounts = { fetched: 0, inserted: 0, updated: 0, rejected: 0 }
  const retryCounts = { trademarks: 0, patents: 0 }
  let coreMetadata: Record<string, unknown> = { pipeline: "current-year-ip" }

  try {
    stage = "start_ingestion"
    ingestion = await startIntelligenceIngestion(admin, {
      sourceKey: "inapi_open_data",
      runType: "delta",
      scope: { trigger: "vercel-cron", pipeline: "current-year-ip", year: new Date().getUTCFullYear() },
    })

    // Current-year freshness is always the first priority. Retries are bounded and
    // limited to errors classified as transient by the shared source retry policy.
    stage = "current_year_sync"
    const [trademarks, patents] = await Promise.all([
      withSourceRetry(() => syncCurrentYearInapiOpenData(), {
        attempts: 3,
        onRetry: ({ attempt, delayMs, error }) => {
          retryCounts.trademarks += 1
          console.warn("[cron/inapi-open-data] retry trademark sync", { attempt, delayMs, error })
        },
      }),
      withSourceRetry(() => syncCurrentYearPatentOpenData(), {
        attempts: 3,
        onRetry: ({ attempt, delayMs, error }) => {
          retryCounts.patents += 1
          console.warn("[cron/inapi-open-data] retry patent sync", { attempt, delayMs, error })
        },
      }),
    ])

    counts = {
      fetched: trademarks.totalFetched + patents.totalFetched,
      inserted: trademarks.totalUpserted + patents.totalUpserted,
      updated: trademarks.totalChangeEvents + patents.totalChangeEvents,
      rejected: 0,
    }

    const activitySince = [trademarks.startedAt, patents.startedAt]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]

    // Keep each PostgREST statement comfortably under Supabase's 8-second
    // authenticator statement_timeout. The database function persists a fixed
    // upper watermark and keyset cursor, so retries resume without skipping rows.
    stage = "company_activity_refresh"
    const companyActivity = await refreshCompanyActivityBatches(admin, activitySince)

    coreMetadata = {
      countSemantics: "inserted_count stores current-year upserts; updated_count stores detected change events",
      retries: retryCounts,
      trademarks: {
        fetched: trademarks.totalFetched,
        upserted: trademarks.totalUpserted,
        changeEvents: trademarks.totalChangeEvents,
      },
      patents: {
        fetched: patents.totalFetched,
        upserted: patents.totalUpserted,
        changeEvents: patents.totalChangeEvents,
      },
      companyActivity,
    }
    coreSyncCompleted = true

    // Detect competitive alerts and strategic patterns BEFORE historical backfill
    // so old records can never become "new" signals.
    stage = "patent_alert_detection"
    const { data: patentAlerts, error: alertError } = await admin.rpc("detect_patent_watch_events")
    if (alertError) throw new Error(`Patent alert detection failed: ${alertError.message}`)

    stage = "strategic_change_detection"
    const strategicChanges = await detectStrategicChanges(admin)

    // Then consume a bounded slice of the missing 2009-2025 applications history.
    // Historical backfill is intentionally outside the current-year health counters.
    stage = "patent_history_backfill"
    const patentHistory = await syncNextPatentHistoryBatch(2)

    stage = "quality_checks"
    const { data: quality, error: qualityError } = await admin.rpc("run_intelligence_quality_checks", {
      p_context: "inapi_daily_cron",
    })
    if (qualityError) throw new Error(`Intelligence quality checks failed to execute: ${qualityError.message}`)

    const qualityFailures = Number((quality as Record<string, unknown> | null)?.failures ?? 0)
    const finalMetadata = {
      ...coreMetadata,
      downstream: {
        patentAlerts,
        strategicChanges,
        patentHistory,
        quality,
      },
    }

    if (qualityFailures > 0) {
      stage = "quality_failed"
      const message = `Critical data quality checks failed: ${qualityFailures}`
      await finishIntelligenceIngestion(admin, {
        runId: ingestion.runId,
        sourceId: ingestion.sourceId,
        ...counts,
        status: "partial",
        errorMessage: message,
        metadata: { ...finalMetadata, failedStage: stage },
      })
      ingestionFinalized = true

      const response = {
        ok: false,
        syncOk: true,
        durationMs: Date.now() - startedAt,
        ingestionRunId: ingestion.runId,
        ingestionStatus: "partial",
        trademarks,
        patents,
        companyActivity,
        patentAlerts,
        strategicChanges,
        patentHistory,
        quality,
      }
      console.error("[cron/inapi-open-data] critical data quality failure", quality)
      return NextResponse.json(response, { status: 503 })
    }

    stage = "finalize"
    await finishIntelligenceIngestion(admin, {
      runId: ingestion.runId,
      sourceId: ingestion.sourceId,
      ...counts,
      status: "completed",
      metadata: finalMetadata,
    })
    ingestionFinalized = true

    return NextResponse.json({
      ok: true,
      syncOk: true,
      durationMs: Date.now() - startedAt,
      ingestionRunId: ingestion.runId,
      ingestionStatus: "completed",
      retries: retryCounts,
      trademarks,
      patents,
      companyActivity,
      patentAlerts,
      strategicChanges,
      patentHistory,
      quality,
    })
  } catch (error) {
    if (error instanceof IntelligenceCircuitOpenError) {
      console.warn("[cron/inapi-open-data] source circuit open", { openUntil: error.openUntil, runId: error.runId })
      return NextResponse.json({
        ok: false,
        syncOk: false,
        ingestionStatus: "blocked",
        failedStage: "circuit_open",
        durationMs: Date.now() - startedAt,
        ingestionRunId: error.runId,
        circuitOpenUntil: error.openUntil,
        error: error.message,
      }, { status: 503 })
    }

    if (ingestion && !ingestionFinalized) {
      const message = error instanceof Error ? error.message : String(error)
      const metadata = { ...coreMetadata, retries: retryCounts, failedStage: stage }

      if (coreSyncCompleted) {
        await finishIntelligenceIngestion(admin, {
          runId: ingestion.runId,
          sourceId: ingestion.sourceId,
          ...counts,
          status: "partial",
          errorMessage: message,
          metadata,
        }).catch((healthError) => console.error("[cron/inapi-open-data] partial health failure", healthError))
      } else {
        await failIntelligenceIngestion(admin, {
          runId: ingestion.runId,
          sourceId: ingestion.sourceId,
          error,
          metadata,
        }).catch((healthError) => console.error("[cron/inapi-open-data] health failure", healthError))
      }
    }

    console.error("[cron/inapi-open-data] sync failed", { stage, error })
    return NextResponse.json(
      {
        ok: false,
        syncOk: coreSyncCompleted,
        ingestionStatus: coreSyncCompleted ? "partial" : "failed",
        failedStage: stage,
        retries: retryCounts,
        durationMs: Date.now() - startedAt,
        ingestionRunId: ingestion?.runId ?? null,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function refreshCompanyActivityBatches(
  admin: ReturnType<typeof createAdminClient>,
  activitySince: string,
) {
  const batches: CompanyActivityBatch[] = []

  for (let index = 0; index < COMPANY_ACTIVITY_MAX_BATCHES; index += 1) {
    const { data, error } = await admin.rpc("refresh_company_ip_activity_from_sync_batch", {
      p_since: activitySince,
      p_limit: COMPANY_ACTIVITY_BATCH_LIMIT,
    })

    if (error) {
      throw new Error(`Company activity refresh batch ${index + 1} failed: ${error.message}`)
    }

    const batch = (data ?? {}) as CompanyActivityBatch
    batches.push(batch)
    if (batch.done === true) return summarizeCompanyActivityBatches(batches)
  }

  throw new Error(`Company activity refresh exceeded ${COMPANY_ACTIVITY_MAX_BATCHES} batches without reaching its checkpoint.`)
}

function summarizeCompanyActivityBatches(batches: CompanyActivityBatch[]) {
  const first = batches[0]
  const last = batches[batches.length - 1]
  const sum = (key: keyof CompanyActivityBatch) => batches.reduce((total, batch) => total + Number(batch[key] ?? 0), 0)

  return {
    done: last?.done === true,
    batches: batches.length,
    batchRecords: sum("batch_records"),
    identityUpserts: sum("identity_upserts"),
    aliasUpserts: sum("alias_upserts"),
    activityUpserts: sum("activity_upserts"),
    reviewsPending: sum("reviews_pending"),
    windowStart: first?.window_start ?? null,
    windowEnd: last?.window_end ?? null,
  }
}
