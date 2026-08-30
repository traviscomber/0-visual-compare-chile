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

    const admin = createAdminClient()
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

    // Detect competitive alerts and strategic patterns BEFORE historical backfill
    // so old records can never become "new" signals.
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
      companyActivity,
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
