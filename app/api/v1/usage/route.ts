import { NextResponse } from "next/server"
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from "@/lib/api/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

interface UsageStats {
  uploads_today: number
  uploads_month: number
  comparisons_today: number
  comparisons_month: number
  storage_gb: number
  api_calls_today: number
  api_calls_month: number
  period: {
    start_date: string
    end_date: string
  }
  current_key: {
    quota_daily: number
    quota_monthly: number
    usage_today: number
    usage_month: number
    remaining_daily: number
    remaining_monthly: number
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.slice(7)
    const auth = await authenticateApiKey(apiKey)
    if (!auth.ok) {
      const status = auth.reason === "quota_exceeded" ? 429 : auth.reason === "unavailable" ? 503 : 401

      return NextResponse.json(
        { error: auth.message, reason: auth.reason },
        {
          status,
          headers:
            auth.reason === "quota_exceeded" &&
            auth.quota_daily !== undefined &&
            auth.quota_monthly !== undefined &&
            auth.usage_today !== undefined &&
            auth.usage_month !== undefined
              ? getQuotaHeaders({
                  quota_daily: auth.quota_daily,
                  quota_monthly: auth.quota_monthly,
                  usage_today: auth.usage_today,
                  usage_month: auth.usage_month,
                })
              : undefined,
        },
      )
    }

    const context = auth.context
    const admin = createAdminClient()
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))

    // Register this request before calculating organization-wide API totals so the
    // response includes the request currently being served.
    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "api.usage.read",
      metadata: {
        usage_today: context.usage_today,
        usage_month: context.usage_month,
      },
    })

    const [
      uploadsTodayResult,
      uploadsMonthResult,
      comparisonsTodayResult,
      comparisonsMonthResult,
      imagesResult,
      apiCallsTodayResult,
      apiCallsMonthResult,
    ] = await Promise.all([
      admin
        .from("images")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", context.organization_id)
        .gte("created_at", today.toISOString()),
      admin
        .from("images")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", context.organization_id)
        .gte("created_at", monthStart.toISOString()),
      admin
        .from("comparisons")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", context.organization_id)
        .gte("created_at", today.toISOString()),
      admin
        .from("comparisons")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", context.organization_id)
        .gte("created_at", monthStart.toISOString()),
      admin.from("images").select("size_bytes").eq("organization_id", context.organization_id),
      admin
        .from("usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", context.organization_id)
        .gte("created_at", today.toISOString()),
      admin
        .from("usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", context.organization_id)
        .gte("created_at", monthStart.toISOString()),
    ])

    const queryErrors = [
      uploadsTodayResult.error,
      uploadsMonthResult.error,
      comparisonsTodayResult.error,
      comparisonsMonthResult.error,
      imagesResult.error,
      apiCallsTodayResult.error,
      apiCallsMonthResult.error,
    ].filter(Boolean)

    if (queryErrors.length > 0) {
      console.error(
        "[v0] usage database query failed",
        queryErrors.map((error) => error?.code ?? "unknown"),
      )
      return NextResponse.json(
        { error: "Usage statistics are temporarily unavailable" },
        {
          status: 503,
          headers: getQuotaHeaders({
            quota_daily: context.quota_daily,
            quota_monthly: context.quota_monthly,
            usage_today: context.usage_today,
            usage_month: context.usage_month,
          }),
        },
      )
    }

    const storageBytes =
      imagesResult.data?.reduce((sum, image) => sum + (Number(image.size_bytes) || 0), 0) ?? 0
    const storageGb = storageBytes / (1024 * 1024 * 1024)

    const stats: UsageStats = {
      uploads_today: uploadsTodayResult.count ?? 0,
      uploads_month: uploadsMonthResult.count ?? 0,
      comparisons_today: comparisonsTodayResult.count ?? 0,
      comparisons_month: comparisonsMonthResult.count ?? 0,
      storage_gb: Math.round(storageGb * 100) / 100,
      api_calls_today: apiCallsTodayResult.count ?? 0,
      api_calls_month: apiCallsMonthResult.count ?? 0,
      period: {
        start_date: monthStart.toISOString(),
        end_date: monthEnd.toISOString(),
      },
      current_key: {
        quota_daily: context.quota_daily,
        quota_monthly: context.quota_monthly,
        usage_today: context.usage_today,
        usage_month: context.usage_month,
        remaining_daily: Math.max(context.quota_daily - context.usage_today, 0),
        remaining_monthly: Math.max(context.quota_monthly - context.usage_month, 0),
      },
    }

    return NextResponse.json(stats, {
      status: 200,
      headers: getQuotaHeaders({
        quota_daily: context.quota_daily,
        quota_monthly: context.quota_monthly,
        usage_today: context.usage_today,
        usage_month: context.usage_month,
      }),
    })
  } catch (error) {
    console.error("[v0] usage error", error)
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 })
  }
}
