import { NextResponse } from "next/server"
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from "@/lib/api/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })

    const auth = await authenticateApiKey(authHeader.slice(7), { reserveQuota: false })
    if (!auth.ok) return NextResponse.json({ error: auth.message, reason: auth.reason }, { status: auth.reason === "unavailable" ? 503 : 401 })

    const context = auth.context
    const admin = createAdminClient()
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    const monthStartDate = monthStart.toISOString().slice(0, 10)

    const [
      keyResult,
      uploadsTodayResult,
      uploadsMonthResult,
      comparisonsTodayResult,
      comparisonsMonthResult,
      imagesResult,
      apiCallsTodayResult,
      apiCallsMonthResult,
      imageCounterResult,
      costLogsResult,
    ] = await Promise.all([
      admin.from("api_keys").select("quota_daily, quota_monthly, quota_images_monthly").eq("id", context.api_key_id).single(),
      admin.from("images").select("id", { count: "exact", head: true }).eq("organization_id", context.organization_id).gte("created_at", today.toISOString()),
      admin.from("images").select("id", { count: "exact", head: true }).eq("organization_id", context.organization_id).gte("created_at", monthStart.toISOString()),
      admin.from("comparisons").select("id", { count: "exact", head: true }).eq("organization_id", context.organization_id).gte("created_at", today.toISOString()),
      admin.from("comparisons").select("id", { count: "exact", head: true }).eq("organization_id", context.organization_id).gte("created_at", monthStart.toISOString()),
      admin.from("images").select("size_bytes").eq("organization_id", context.organization_id),
      admin.from("usage_logs").select("id", { count: "exact", head: true }).eq("organization_id", context.organization_id).gte("created_at", today.toISOString()),
      admin.from("usage_logs").select("id", { count: "exact", head: true }).eq("organization_id", context.organization_id).gte("created_at", monthStart.toISOString()),
      admin.from("api_quota_counters").select("usage_count").eq("api_key_id", context.api_key_id).eq("period_type", "image_month").eq("period_start", monthStartDate).maybeSingle(),
      admin.from("usage_logs").select("billable_units, cache_hit, estimated_cost_usd, input_tokens, cached_input_tokens, output_tokens").eq("api_key_id", context.api_key_id).gte("created_at", monthStart.toISOString()).in("action", ["vision.analyze", "vision.compare"]),
    ])

    const errors = [keyResult.error, uploadsTodayResult.error, uploadsMonthResult.error, comparisonsTodayResult.error, comparisonsMonthResult.error, imagesResult.error, apiCallsTodayResult.error, apiCallsMonthResult.error, imageCounterResult.error, costLogsResult.error].filter(Boolean)
    if (errors.length > 0) {
      console.error("[usage] database query failed", errors.map((error) => error?.code ?? "unknown"))
      return NextResponse.json({ error: "Usage statistics are temporarily unavailable" }, { status: 503 })
    }

    const storageBytes = imagesResult.data?.reduce((sum, image) => sum + (Number(image.size_bytes) || 0), 0) ?? 0
    const imageLimit = Number(keyResult.data?.quota_images_monthly ?? 5000)
    const imageUsage = Number(imageCounterResult.data?.usage_count ?? 0)
    const logs = costLogsResult.data ?? []
    const providerCostUsd = logs.reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0)
    const cacheHits = logs.filter((row) => Boolean(row.cache_hit)).length
    const billableUnits = logs.reduce((sum, row) => sum + Number(row.billable_units ?? 0), 0)
    const inputTokens = logs.reduce((sum, row) => sum + Number(row.input_tokens ?? 0), 0)
    const cachedInputTokens = logs.reduce((sum, row) => sum + Number(row.cached_input_tokens ?? 0), 0)
    const outputTokens = logs.reduce((sum, row) => sum + Number(row.output_tokens ?? 0), 0)

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "api.usage.read",
      billable_units: 0,
      metadata: { image_usage_month: imageUsage, image_limit_month: imageLimit },
    })

    return NextResponse.json({
      uploads_today: uploadsTodayResult.count ?? 0,
      uploads_month: uploadsMonthResult.count ?? 0,
      comparisons_today: comparisonsTodayResult.count ?? 0,
      comparisons_month: comparisonsMonthResult.count ?? 0,
      storage_gb: Math.round((storageBytes / (1024 * 1024 * 1024)) * 100) / 100,
      api_calls_today: apiCallsTodayResult.count ?? 0,
      api_calls_month: apiCallsMonthResult.count ?? 0,
      period: { start_date: monthStart.toISOString(), end_date: monthEnd.toISOString() },
      images: {
        quota_monthly: imageLimit,
        used_month: imageUsage,
        remaining_month: Math.max(imageLimit - imageUsage, 0),
        usage_percent: imageLimit > 0 ? Math.round((imageUsage / imageLimit) * 10000) / 100 : 0,
      },
      economics: {
        billable_image_units_month: billableUnits,
        provider_cost_usd_month: Math.round(providerCostUsd * 1_000_000) / 1_000_000,
        average_provider_cost_usd_per_image: billableUnits > 0 ? Math.round((providerCostUsd / billableUnits) * 1_000_000) / 1_000_000 : 0,
        cache_hits_month: cacheHits,
        cache_hit_rate_percent: logs.length > 0 ? Math.round((cacheHits / logs.length) * 10000) / 100 : 0,
        input_tokens_month: inputTokens,
        cached_input_tokens_month: cachedInputTokens,
        output_tokens_month: outputTokens,
      },
      current_key: {
        quota_daily: Number(keyResult.data?.quota_daily ?? context.quota_daily),
        quota_monthly: Number(keyResult.data?.quota_monthly ?? context.quota_monthly),
      },
    }, {
      status: 200,
      headers: {
        ...getQuotaHeaders({ quota_daily: Number(keyResult.data?.quota_daily ?? context.quota_daily), quota_monthly: Number(keyResult.data?.quota_monthly ?? context.quota_monthly), usage_today: 0, usage_month: 0 }),
        "X-Image-Limit-Monthly": String(imageLimit),
        "X-Image-Remaining-Monthly": String(Math.max(imageLimit - imageUsage, 0)),
      },
    })
  } catch (error) {
    console.error("[usage] error", error)
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 })
  }
}
