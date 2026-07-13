import { NextResponse } from "next/server"
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from "@/lib/api/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

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

    const url = new URL(request.url)
    const parsedLimit = Number(url.searchParams.get("limit") || "50")
    const parsedOffset = Number(url.searchParams.get("offset") || "0")
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50
    const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0

    const admin = createAdminClient()
    const { data: comparisons, error } = await admin
      .from("comparisons")
      .select("*")
      .eq("organization_id", context.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[v0] comparisons query error", error)
      return NextResponse.json({ error: "Failed to fetch comparisons" }, { status: 500 })
    }

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "api.comparisons.list",
      metadata: { limit, offset, count: comparisons?.length ?? 0 },
    })

    return NextResponse.json(
      {
        data: comparisons ?? [],
        limit,
        offset,
        count: comparisons?.length ?? 0,
      },
      {
        status: 200,
        headers: getQuotaHeaders({
          quota_daily: context.quota_daily,
          quota_monthly: context.quota_monthly,
          usage_today: context.usage_today,
          usage_month: context.usage_month,
          increment: 1,
        }),
      },
    )
  } catch (error) {
    console.error("[v0] comparisons list error", error)
    return NextResponse.json({ error: "Failed to fetch comparisons" }, { status: 500 })
  }
}
