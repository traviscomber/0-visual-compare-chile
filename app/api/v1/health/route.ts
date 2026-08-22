import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const INAPI_FRESH_HOURS = 36

type Freshness = {
  status: "fresh" | "stale" | "unknown"
  lastSuccessfulSyncAt: string | null
  ageHours: number | null
}

function resolveRevision() {
  return process.env.VERCEL_GIT_COMMIT_SHA || process.env.APP_REVISION || "local"
}

async function readFreshness(source: string, now: number): Promise<Freshness> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("inapi_sync_runs")
    .select("finished_at")
    .eq("source", source)
    .eq("status", "completed")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  const lastSuccessfulSyncAt = data?.finished_at ? String(data.finished_at) : null
  const ageHours = lastSuccessfulSyncAt
    ? Math.max(0, (now - new Date(lastSuccessfulSyncAt).getTime()) / 3_600_000)
    : null

  return {
    status: ageHours !== null && ageHours <= INAPI_FRESH_HOURS ? "fresh" : lastSuccessfulSyncAt ? "stale" : "unknown",
    lastSuccessfulSyncAt,
    ageHours: ageHours === null ? null : Number(ageHours.toFixed(2)),
  }
}

export async function GET() {
  const now = Date.now()
  let trademarks: Freshness = { status: "unknown", lastSuccessfulSyncAt: null, ageHours: null }
  let patents: Freshness = { status: "unknown", lastSuccessfulSyncAt: null, ageHours: null }

  try {
    ;[trademarks, patents] = await Promise.all([
      readFreshness("inapi-open-data", now),
      readFreshness("inapi-patent-open-data", now),
    ])
  } catch (error) {
    console.error("[health] failed to read INAPI sync freshness", error)
  }

  const healthy = trademarks.status === "fresh" && patents.status === "fresh"

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      version: "1.0.0",
      revision: resolveRevision(),
      timestamp: new Date(now).toISOString(),
      dependencies: {
        inapi: {
          trademarks: { ...trademarks, freshnessThresholdHours: INAPI_FRESH_HOURS },
          patents: { ...patents, freshnessThresholdHours: INAPI_FRESH_HOURS },
        },
      },
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  )
}
