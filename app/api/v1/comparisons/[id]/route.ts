import { NextResponse } from "next/server"
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from "@/lib/api/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
    const { data: comparison, error } = await admin
      .from("comparisons")
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organization_id)
      .single()

    if (error || !comparison) {
      return NextResponse.json({ error: "Comparison not found" }, { status: 404 })
    }

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "api.comparisons.read",
      metadata: { comparison_id: id },
    })

    return NextResponse.json(
      { success: true, data: comparison },
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
    console.error("[v0] get comparison error", error)
    return NextResponse.json({ error: "Failed to fetch comparison" }, { status: 500 })
  }
}
