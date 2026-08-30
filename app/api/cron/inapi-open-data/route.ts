import { NextResponse } from "next/server"
import { syncCurrentYearInapiOpenData } from "@/lib/inapi/open-data-sync"
import { syncCurrentYearPatentOpenData, syncNextPatentHistoryBatch } from "@/lib/inapi/patent-open-data-sync"
import { detectStrategicChanges } from "@/lib/intelligence/strategic-change-engine"
import {
  failIntelligenceIngestion,
  finishIntelligenceIngestion,
  startIntelligenceIngestion,
} from "@/lib/intelligence/ingestion-observability"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

type IngestionHandle = Awaited<ReturnType<typeof startIntelligenceIngestion>>

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  let ingestion: IngestionHandle | null = null
  let ingestionCompleted = false

  try {
    ingestion = await startIntelligenceIngestion(admin, {
      sourceKey: "inapi_open_data",
      runType: "delta",
      scope: { trigger: "vercel-cron", pipeline: "current-year-ip", year: new Date().getUTCFullYear() },
    })

    // Current-year freshness is always the first priority.
    const [trademarks, patents] = await Promise.all([
      syncCurrentYearInapiOpenData(),
      syncCurrentYearPatentOpenData(),
    ])

    const activitySince = [trademarks.startedAt, patents.startedAt]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]

    // Maintain the company/titular identity layer from exactly the records touched
    // in this sync. Historical patent backfill runs later and cannot pollute the
    // 12-month direction comparison.
    const { data: companyActivity, error: companyActivityError } = await admin.rpc(
      "refresh_company_ip_activity_from_sync",
      { p_since: activitySince },
    )
    if (companyActivityError) {
      throw new Error(`Company activity refresh failed: ${companyActivityError.message}`)
    }

    await finishIntelligenceIngestion(admin, {
      runId: ingestion.runId,
      sourceId: ingestion.sourceId,
      fetched: trademarks.totalFetched + patents.totalFetched,
      inserted: trademarks.totalUpserted + patents.totalUpserted,
      updated: trademarks.totalChangeEvents + patents.totalChangeEvents,
      rejected: 0,
      metadata: {
        countSemantics: "inserted_count stores current-year upserts; updated_count stores detected change events",
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
      },
    })
    ingestionCompleted = true

    // Detect competitive alerts and strategic patterns BEFORE historical backfill
    // so old records can never become "new" signals.
    const { data: patentAlerts, error: alertError } = await admin.rpc("detect_patent_watch_events")
    if (alertError) throw new Error(`Patent alert detection failed: ${alertError.message}`)

    const strategicChanges = await detectStrategicChanges(admin)

    // Then consume a bounded slice of the missing 2009-2025 applications history.
    // Historical backfill is intentionally outside the current-year health counters.
    const patentHistory = await syncNextPatentHistoryBatch(2)

    const { data: quality, error: qualityError } = await admin.rpc("run_intelligence_quality_checks", {
      p_context: "inapi_daily_cron",
    })
    if (qualityError) throw new Error(`Intelligence quality checks failed to execute: ${qualityError.message}`)

    const qualityFailures = Number((quality as Record<string, unknown> | null)?.failures ?? 0)
    const response = {
      ok: qualityFailures === 0,
      syncOk: true,
      durationMs: Date.now() - startedAt,
      ingestionRunId: ingestion.runId,
      trademarks,
      patents,
      companyActivity,
      patentAlerts,
      strategicChanges,
      patentHistory,
      quality,
    }

    if (qualityFailures > 0) {
      console.error("[cron/inapi-open-data] critical data quality failure", quality)
      return NextResponse.json(response, { status: 503 })
    }

    return NextResponse.json(response)
  } catch (error) {
    if (ingestion && !ingestionCompleted) {
      await failIntelligenceIngestion(admin, {
        runId: ingestion.runId,
        sourceId: ingestion.sourceId,
        error,
        metadata: { pipeline: "current-year-ip" },
      }).catch((healthError) => console.error("[cron/inapi-open-data] health failure", healthError))
    }

    console.error("[cron/inapi-open-data] sync failed", error)
    return NextResponse.json(
      {
        ok: false,
        syncOk: ingestionCompleted,
        durationMs: Date.now() - startedAt,
        ingestionRunId: ingestion?.runId ?? null,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
