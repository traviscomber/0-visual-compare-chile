import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PRIVATE_NO_STORE_HEADERS, requireAdmin } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const authorization = await requireAdmin()
    if (!authorization.ok) return authorization.response

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
      searchesResponse,
      failedSearchesResponse,
      emptySearchesResponse,
    ] = await Promise.all([
      admin.from("inapi_rate_state").select("*").eq("singleton", true).single(),
      admin.from("inapi_remote_requests").select("id", { count: "exact", head: true }).gte("requested_at", dayStart.toISOString()),
      admin.from("inapi_remote_requests").select("id", { count: "exact", head: true }).gte("requested_at", hourStart.toISOString()),
      admin.from("inapi_remote_requests").select("id", { count: "exact", head: true }).gte("requested_at", minuteStart.toISOString()),
      admin.from("inapi_remote_requests").select("id", { count: "exact", head: true }).eq("success", false).gte("requested_at", dayAgo.toISOString()),
      admin.from("inapi_jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "running"]),
      admin.from("inapi_jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
      admin.from("inapi_jobs").select("id", { count: "exact", head: true }).eq("status", "running"),
      admin.from("inapi_query_cache").select("cache_key", { count: "exact", head: true }).gt("expires_at", now.toISOString()),
      admin.from("inapi_remote_requests").select("id, cache_key, requested_at, finished_at, success, status_code, duration_ms, error_code").order("requested_at", { ascending: false }).limit(12),
      admin.from("search_history").select("duration_ms, results_count, cached", { count: "exact" }).eq("source", "inapi-live").gte("created_at", dayAgo.toISOString()),
      admin.from("search_history").select("id", { count: "exact", head: true }).eq("source", "inapi-live").eq("status", "failed").gte("created_at", dayAgo.toISOString()),
      admin.from("search_history").select("id", { count: "exact", head: true }).eq("source", "inapi-live").eq("status", "success").eq("results_count", 0).gte("created_at", dayAgo.toISOString()),
    ])

    if (stateResponse.error) throw stateResponse.error
    if (recentResponse.error) throw recentResponse.error
    if (searchesResponse.error) throw searchesResponse.error

    const recent = recentResponse.data ?? []
    const successfulDurations = recent.filter((item) => item.success === true && typeof item.duration_ms === "number").map((item) => item.duration_ms as number)
    const averageDurationMs = successfulDurations.length ? Math.round(successfulDurations.reduce((total, value) => total + value, 0) / successfulDurations.length) : null

    const searches = searchesResponse.data ?? []
    const searchDurations = searches.map((item) => item.duration_ms).filter((value): value is number => typeof value === "number")
    const averageSearchDurationMs = searchDurations.length ? Math.round(searchDurations.reduce((total, value) => total + value, 0) / searchDurations.length) : null
    const cachedSearches = searches.filter((item) => item.cached === true).length

    return NextResponse.json({
      state: stateResponse.data,
      usage: { minute: minuteResponse.count ?? 0, hour: hourResponse.count ?? 0, day: todayResponse.count ?? 0 },
      queue: { active: activeJobsResponse.count ?? 0, queued: queuedJobsResponse.count ?? 0, running: runningJobsResponse.count ?? 0 },
      cache: { activeEntries: cacheResponse.count ?? 0 },
      health: { failures24h: failuresResponse.count ?? 0, averageDurationMs },
      directSearch: {
        total24h: searchesResponse.count ?? 0,
        failures24h: failedSearchesResponse.count ?? 0,
        emptyResults24h: emptySearchesResponse.count ?? 0,
        averageDurationMs: averageSearchDurationMs,
        cached24h: cachedSearches,
      },
      recent,
      generatedAt: now.toISOString(),
    }, { status: 200, headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[inapi-operations] metrics error", error)
    return NextResponse.json({ error: "No fue posible cargar la operación INAPI." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
