import { createHash, randomBytes } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

export interface ApiKeyContext {
  api_key_id: string
  organization_id: string
  user_id: string
  quota_daily: number
  quota_monthly: number
  usage_today: number
  usage_month: number
  quota_reserved: true
}

export type ApiKeyAuthResult =
  | { ok: true; context: ApiKeyContext }
  | {
      ok: false
      reason: "invalid" | "quota_exceeded" | "unavailable"
      message: string
      quota_daily?: number
      quota_monthly?: number
      usage_today?: number
      usage_month?: number
    }

interface QuotaReservationRow {
  allowed: boolean
  quota_daily: number
  quota_monthly: number
  usage_today: number
  usage_month: number
}

export async function authenticateApiKey(apiKey: string): Promise<ApiKeyAuthResult> {
  if (!apiKey || apiKey.length > 100 || !/^sc_[a-f0-9]{64}$/.test(apiKey)) {
    return { ok: false, reason: "invalid", message: "Invalid API key" }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("api_keys")
      .select("id, organization_id, user_id, expires_at")
      .eq("key_hash", hashApiKey(apiKey))
      .eq("is_active", true)
      .maybeSingle()

    if (error || !data) {
      return { ok: false, reason: "invalid", message: "Invalid API key" }
    }

    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
      return { ok: false, reason: "invalid", message: "API key expired" }
    }

    const { data: reservationData, error: reservationError } = await admin.rpc("reserve_api_quota", {
      p_api_key_id: data.id,
      p_organization_id: data.organization_id,
      p_user_id: data.user_id,
    })

    const reservation = Array.isArray(reservationData)
      ? (reservationData[0] as QuotaReservationRow | undefined)
      : (reservationData as QuotaReservationRow | null)

    if (reservationError || !reservation) {
      console.error("[api-auth] quota reservation unavailable", reservationError?.code ?? "missing-result")
      return {
        ok: false,
        reason: "unavailable",
        message: "API quota service temporarily unavailable",
      }
    }

    if (!reservation.allowed) {
      return {
        ok: false,
        reason: "quota_exceeded",
        message: "API key quota exceeded",
        quota_daily: reservation.quota_daily,
        quota_monthly: reservation.quota_monthly,
        usage_today: reservation.usage_today,
        usage_month: reservation.usage_month,
      }
    }

    return {
      ok: true,
      context: {
        api_key_id: data.id,
        organization_id: data.organization_id,
        user_id: data.user_id,
        quota_daily: reservation.quota_daily,
        quota_monthly: reservation.quota_monthly,
        usage_today: reservation.usage_today,
        usage_month: reservation.usage_month,
        quota_reserved: true,
      },
    }
  } catch (error) {
    console.error("[api-auth] authentication failed", error instanceof Error ? error.name : "unknown")
    return { ok: false, reason: "unavailable", message: "API authentication temporarily unavailable" }
  }
}

export async function logApiKeyUsage(input: {
  organization_id: string
  user_id: string
  api_key_id: string
  action: string
  metadata?: Record<string, unknown>
}) {
  const admin = createAdminClient()
  const { error } = await admin.from("usage_logs").insert({
    user_id: input.user_id,
    organization_id: input.organization_id,
    action: input.action,
    metadata: { api_key_id: input.api_key_id, ...input.metadata },
  })

  if (error) {
    console.error("[api-auth] usage log insert failed", error.code)
  }
}

export function getQuotaHeaders(input: {
  quota_daily: number
  quota_monthly: number
  usage_today: number
  usage_month: number
  increment?: number
}) {
  const increment = input.increment ?? 0
  const usageToday = input.usage_today + increment
  const usageMonth = input.usage_month + increment

  return {
    "X-RateLimit-Limit-Daily": String(input.quota_daily),
    "X-RateLimit-Remaining-Daily": String(Math.max(input.quota_daily - usageToday, 0)),
    "X-RateLimit-Limit-Monthly": String(input.quota_monthly),
    "X-RateLimit-Remaining-Monthly": String(Math.max(input.quota_monthly - usageMonth, 0)),
  }
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

export function generateApiKey(): string {
  return `sc_${randomBytes(32).toString("hex")}`
}
