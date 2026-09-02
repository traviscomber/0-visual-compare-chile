import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncGdeltRawFeed } from "@/lib/intelligence/gdelt-raw-sync"
import { syncGdeltContextBundle } from "@/lib/intelligence/gdelt-context-sync"
import { fuseGdeltIntoStrategicWatches } from "@/lib/intelligence/gdelt-watch-fusion"
import { IntelligenceCircuitOpenError } from "@/lib/intelligence/ingestion-observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const startedAt = Date.now()
  try {
    const admin = createAdminClient()
    const reference = new Date()
    const events = await syncGdeltRawFeed(admin, reference)
    const context = await syncGdeltContextBundle(admin)
    const watchFusion = await fuseGdeltIntoStrategicWatches(admin, reference)
    return NextResponse.json({ ok: true, events, context, watchFusion, durationMs: Date.now() - startedAt }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[cron/gdelt-raw-feed] sync failed", { error: message })
    return NextResponse.json({ ok: false, error: message, durationMs: Date.now() - startedAt }, { status: error instanceof IntelligenceCircuitOpenError ? 503 : 500 })
  }
}
