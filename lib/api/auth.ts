import { createHash, randomBytes } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { DEFAULT_API_KEY_DAILY_QUOTA, DEFAULT_API_KEY_MONTHLY_QUOTA } from "@/lib/api/quotas"

export interface ApiKeyContext {
  api_key_id: string
  organization_id: string
  user_id: string
  quota_daily: number
  quota_monthly: number
  usage_today: number
  usage_month: number
  quota_reserved: boolean
}

export type ApiKeyAuthResult =
  | { ok: true; context: ApiKeyContext }
  | {
      ok: false
      reason: "invalid" | "quota_exceeded"
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

async function getLegacyQuotaUsage(input: {
  admin: ReturnType<typeof createAdminClient>
  apiKeyId: string
  organizationId: string
}) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ count: usageToday }, { count: usageMonth }] = await Promise.all([
    input.admin
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId)
      .contains("metadata", { api_key_id: input.apiKeyId })
      .gte("created_at", today),
    input.admin
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId)
      .contains("metadata", { api_key_id: input.apiKeyId })
      .gte("created_at", monthStart),
  ])

  return {
    usageToday: usageToday ?? 0,
    usageMonth: usageMonth ?? 0,
  }
}

export async function authenticateApiKey(apiKey: string): Promise<ApiKeyAuthResult> {
  if (!apiKey) {
    return { ok: false, reason: "invalid", message: "Invalid API key" }
  }

  try {
    const admin = createAdminClient()

    const { data, error } = await admin
      .from("api_keys")
      .select("id, organization_id, user_id, expires_at, quota_daily, quota_monthly")
      .eq("key_hash", hashApiKey(apiKey))
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return { ok: false, reason: "invalid", message: "Invalid API key" }
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { ok: false, reason: "invalid", message: "API key expired" }
    }

    const dailyQuota = data.quota_daily ?? DEFAULT_API_KEY_DAILY_QUOTA
    const monthlyQuota = data.quota_monthly ?? DEFAULT_API_KEY_MONTHLY_QUOTA

    const { data: reservationData, error: reservationError } = await admin.rpc("reserve_api_quota", {
      p_api_key_id: data.id,
      p_organization_id: data.organization_id,
      p_user_id: data.user_id,
    })

    const reservation = Array.isArray(reservationData)
      ? (reservationData[0] as QuotaReservationRow | undefined)
      : (reservationData as QuotaReservationRow | null)

    if (!reservationError && reservation) {
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
    }

    // Compatibility fallback while the database migration is being applied.
    // Once reserve_api_quota exists, all requests use the atomic path above.
    const legacy = await getLegacyQuotaUsage({
      admin,
      apiKeyId: data.id,
      organizationId: data.organization_id,
    })

    if (legacy.usageToday >= dailyQuota || legacy.usageMonth >= monthlyQuota) {
      return {
        ok: false,
        reason: "quota_exceeded",
        message: "API key quota exceeded",
        quota_daily: dailyQuota,
        quota_monthly: monthlyQuota,
        usage_today: legacy.usageToday,
        usage_month: legacy.usageMonth,
      }
    }

    await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id)

    return {
      ok: true,
      context: {
        api_key_id: data.id,
        organization_id: data.organization_id,
        user_id: data.user_id,
        quota_daily: dailyQuota,
        quota_monthly: monthlyQuota,
        usage_today: legacy.usageToday,
        usage_month: legacy.usageMonth,
        quota_reserved: false,
      },
    }
  } catch (error) {
    console.error("[api] API key authentication error", error)
    return { ok: false, reason: "invalid", message: "Invalid API key" }
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
    metadata: {
      api_key_id: input.api_key_id,
      ...input.metadata,
    },
  })

  if (error) {
    console.error("[api] usage log insert failed", {
      action: input.action,
      organization_id: input.organization_id,
      api_key_id: input.api_key_id,
      error: error.message,
    })
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
