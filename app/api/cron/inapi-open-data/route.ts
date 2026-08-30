import { NextResponse } from "next/server"
import { syncCurrentYearInapiOpenData } from "@/lib/inapi/open-data-sync"
import { syncCurrentYearPatentOpenData, syncNextPatentHistoryBatch } from "@/lib/inapi/patent-open-data-sync"
import { detectStrategicChanges } from "@/lib/intelligence/strategic-change-engine"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()
  try {
    // Current-year freshness is always the first priority.
    const [trademarks, patents] = await Promise.all([
      syncCurrentYearInapiOpenData(),
      syncCurrentYearPatentOpenData(),
    ])

    // Detect competitive alerts and strategic patterns BEFORE historical backfill
    // so old records can never become "new" signals.
    const admin = createAdminClient()
    const { data: patentAlerts, error: alertError } = await admin.rpc("detect_patent_watch_events")
    if (alertError) throw new Error(`Patent alert detection failed: ${alertError.message}`)

    const strategicChanges = await detectStrategicChanges(admin)

    // Then consume a bounded slice of the missing 2009-2025 applications history.
    // Two years/run keeps the cron restart-safe and inside the Vercel duration budget.
    const patentHistory = await syncNextPatentHistoryBatch(2)

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      trademarks,
      patents,
      patentAlerts,
      strategicChanges,
      patentHistory,
    })
  } catch (error) {
    console.error("[cron/inapi-open-data] sync failed", error)
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
