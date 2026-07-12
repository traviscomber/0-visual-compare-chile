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
      return NextResponse.json(
        { error: auth.message, reason: auth.reason },
        {
          status: auth.reason === "quota_exceeded" ? 429 : 401,
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const { count: uploadsToday } = await admin
      .from("images")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", today.toISOString())

    const { count: uploadsMonth } = await admin
      .from("images")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", monthStart.toISOString())

    const { count: comparisonsToday } = await admin
      .from("comparisons")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", today.toISOString())

    const { count: comparisonsMonth } = await admin
      .from("comparisons")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", monthStart.toISOString())

    const { data: images } = await admin
      .from("images")
      .select("size_bytes")
      .eq("organization_id", context.organization_id)

    const storageBytes = images?.reduce((sum, image) => sum + (image.size_bytes || 0), 0) || 0
    const storageGb = storageBytes / (1024 * 1024 * 1024)

    const { count: apiCallsToday } = await admin
      .from("usage_logs")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", today.toISOString())

    const { count: apiCallsMonth } = await admin
      .from("usage_logs")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", monthStart.toISOString())

    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const stats: UsageStats = {
      uploads_today: uploadsToday || 0,
      uploads_month: uploadsMonth || 0,
      comparisons_today: comparisonsToday || 0,
      comparisons_month: comparisonsMonth || 0,
      storage_gb: Math.round(storageGb * 100) / 100,
      api_calls_today: apiCallsToday || 0,
      api_calls_month: apiCallsMonth || 0,
      period: {
        start_date: monthStart.toISOString(),
        end_date: monthEnd.toISOString(),
      },
      current_key: {
        quota_daily: context.quota_daily,
        quota_monthly: context.quota_monthly,
        usage_today: context.usage_today + 1,
        usage_month: context.usage_month + 1,
        remaining_daily: Math.max(context.quota_daily - (context.usage_today + 1), 0),
        remaining_monthly: Math.max(context.quota_monthly - (context.usage_month + 1), 0),
      },
    }

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "api.usage.read",
      metadata: {
        usage_today: context.usage_today + 1,
        usage_month: context.usage_month + 1,
      },
    })

    return NextResponse.json(stats, {
      status: 200,
      headers: getQuotaHeaders({
        quota_daily: context.quota_daily,
        quota_monthly: context.quota_monthly,
        usage_today: context.usage_today,
        usage_month: context.usage_month,
        increment: 1,
      }),
    })
  } catch (error) {
    console.error("[v0] usage error", error)
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 })
  }
}
