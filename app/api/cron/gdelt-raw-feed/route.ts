import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncGdeltRawFeed } from "@/lib/intelligence/gdelt-raw-sync"
import { syncGdeltContextBundle } from "@/lib/intelligence/gdelt-context-sync"
import { fuseGdeltIntoStrategicWatches } from "@/lib/intelligence/gdelt-watch-fusion"
import { IntelligenceCircuitOpenError } from "@/lib/intelligence/ingestion-observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

type NonBlockingStage = {
  ok: false
  skipped?: boolean
  reason: string
  error: string
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const startedAt = Date.now()
  try {
    const admin = createAdminClient()
    const reference = new Date()

    // Raw Events are the canonical ingestion contract. If this phase fails, the
    // cron must fail because no trustworthy new GDELT event corpus was recorded.
    const events = await syncGdeltRawFeed(admin, reference)

    let partial = false
    let context: Awaited<ReturnType<typeof syncGdeltContextBundle>> | NonBlockingStage
    try {
      context = await syncGdeltContextBundle(admin)
    } catch (error) {
      const message = errorMessage(error)
      if (!isContextBundleNotReady(message)) throw error
      partial = true
      context = { ok: false, skipped: true, reason: "bundle_not_ready", error: message }
      console.warn("[cron/gdelt-raw-feed] synchronized context bundle not ready; canonical raw ingest preserved", { error: message })
    }

    let watchFusion: Awaited<ReturnType<typeof fuseGdeltIntoStrategicWatches>> | NonBlockingStage
    try {
      watchFusion = await fuseGdeltIntoStrategicWatches(admin, reference)
    } catch (error) {
      const message = errorMessage(error)
      partial = true
      watchFusion = { ok: false, reason: "post_processing_unavailable", error: message }
      console.warn("[cron/gdelt-raw-feed] watch fusion deferred; canonical source corpus remains valid", { error: message })
    }

    return NextResponse.json({
      ok: true,
      partial,
      events,
      context,
      watchFusion,
      durationMs: Date.now() - startedAt,
    }, { status: 200 })
  } catch (error) {
    const message = errorMessage(error)
    console.error("[cron/gdelt-raw-feed] canonical sync failed", { error: message })
    return NextResponse.json({ ok: false, error: message, durationMs: Date.now() - startedAt }, { status: error instanceof IntelligenceCircuitOpenError ? 503 : 500 })
  }
}

function isContextBundleNotReady(message: string) {
  return message === "No complete synchronized GDELT context bundle available"
    || message === "GDELT context timestamps are not synchronized"
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
