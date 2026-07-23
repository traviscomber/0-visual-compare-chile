import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const admin = createAdminClient()
    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setUTCHours(0, 0, 0, 0)
    const hourStart = new Date(now.getTime() - 60 * 60 * 1000)
    const minuteStart = new Date(now.getTime() - 60 * 1000)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      stateResponse,
      todayResponse,
      hourResponse,
      minuteResponse,
      failuresResponse,
      activeJobsResponse,
      queuedJobsResponse,
      runningJobsResponse,
      cacheResponse,
      recentResponse,
    ] = await Promise.all([
      admin.from("inapi_rate_state").select("*").eq("singleton", true).single(),
      admin.from("inapi_remote_requests").select("id", { count: "exact", head: true }).gte("requested_at", dayStart.toISOString()),
      admin.from("inapi_remote_requests").select("id", { count: "exact", head: true }).gte("requested_at", hourStart.toISOString()),
      admin.from("inapi_remote_requests").select("id", { count: "exact", head: true }).gte("requested_at", minuteStart.toISOString()),
      admin
        .from("inapi_remote_requests")
        .select("id", { count: "exact", head: true })
        .eq("success", false)
        .gte("requested_at", dayAgo.toISOString()),
      admin.from("inapi_jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "running"]),
      admin.from("inapi_jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
      admin.from("inapi_jobs").select("id", { count: "exact", head: true }).eq("status", "running"),
      admin.from("inapi_query_cache").select("cache_key", { count: "exact", head: true }).gt("expires_at", now.toISOString()),
      admin
        .from("inapi_remote_requests")
        .select("id, cache_key, requested_at, finished_at, success, status_code, duration_ms, error_code")
        .order("requested_at", { ascending: false })
        .limit(12),
    ])

    if (stateResponse.error) throw stateResponse.error
    if (recentResponse.error) throw recentResponse.error

    const recent = recentResponse.data ?? []
    const successfulDurations = recent
      .filter((item) => item.success === true && typeof item.duration_ms === "number")
      .map((item) => item.duration_ms as number)
    const averageDurationMs = successfulDurations.length
      ? Math.round(successfulDurations.reduce((total, value) => total + value, 0) / successfulDurations.length)
      : null

    return NextResponse.json(
      {
        state: stateResponse.data,
        usage: {
          minute: minuteResponse.count ?? 0,
          hour: hourResponse.count ?? 0,
          day: todayResponse.count ?? 0,
        },
        queue: {
          active: activeJobsResponse.count ?? 0,
          queued: queuedJobsResponse.count ?? 0,
          running: runningJobsResponse.count ?? 0,
        },
        cache: {
          activeEntries: cacheResponse.count ?? 0,
        },
        health: {
          failures24h: failuresResponse.count ?? 0,
          averageDurationMs,
        },
        recent,
        generatedAt: now.toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    )
  } catch (error) {
    console.error("[inapi-operations] metrics error", error)
    return NextResponse.json({ error: "No fue posible cargar la operacion INAPI." }, { status: 500 })
  }
}
