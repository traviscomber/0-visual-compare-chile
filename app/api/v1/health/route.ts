import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const INAPI_FRESH_HOURS = 36

function resolveRevision() {
  return process.env.VERCEL_GIT_COMMIT_SHA || process.env.APP_REVISION || "local"
}

export async function GET() {
  const now = Date.now()
  let inapi: {
    status: "fresh" | "stale" | "unknown"
    lastSuccessfulSyncAt: string | null
    ageHours: number | null
  } = {
    status: "unknown",
    lastSuccessfulSyncAt: null,
    ageHours: null,
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("inapi_sync_runs")
      .select("finished_at")
      .eq("source", "inapi-open-data")
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

    inapi = {
      status: ageHours !== null && ageHours <= INAPI_FRESH_HOURS ? "fresh" : lastSuccessfulSyncAt ? "stale" : "unknown",
      lastSuccessfulSyncAt,
      ageHours: ageHours === null ? null : Number(ageHours.toFixed(2)),
    }
  } catch (error) {
    console.error("[health] failed to read INAPI sync freshness", error)
  }

  const healthy = inapi.status === "fresh"

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      version: "1.0.0",
      revision: resolveRevision(),
      timestamp: new Date(now).toISOString(),
      dependencies: {
        inapi: {
          ...inapi,
          freshnessThresholdHours: INAPI_FRESH_HOURS,
        },
      },
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
