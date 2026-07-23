import { createAdminClient } from "@/lib/supabase/admin"
import { generateApiKey, hashApiKey } from "@/lib/api/auth"
import { DEFAULT_API_KEY_DAILY_QUOTA, DEFAULT_API_KEY_MONTHLY_QUOTA } from "@/lib/api/quotas"

export interface ApiKeyRecord {
  id: string
  name: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  quota_daily: number
  quota_monthly: number
  usage_today: number
  usage_month: number
}

export async function createApiKey(
  organizationId: string,
  userId: string,
  name: string,
  expiresAt?: Date,
  quotas?: { daily?: number; monthly?: number },
): Promise<{ key: string; id: string } | null> {
  try {
    const admin = createAdminClient()
    const apiKey = generateApiKey()
    const { data, error } = await admin
      .from("api_keys")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        key_hash: hashApiKey(apiKey),
        name,
        expires_at: expiresAt?.toISOString(),
        quota_daily: quotas?.daily ?? DEFAULT_API_KEY_DAILY_QUOTA,
        quota_monthly: quotas?.monthly ?? DEFAULT_API_KEY_MONTHLY_QUOTA,
      })
      .select("id")
      .single()

    if (error || !data) {
      console.error("[api-keys] create failed", error?.code ?? "missing-result")
      return null
    }

    return { key: apiKey, id: data.id }
  } catch (error) {
    console.error("[api-keys] create failed", error instanceof Error ? error.name : "unknown")
    return null
  }
}

export async function rotateApiKey(
  keyId: string,
  organizationId: string,
  userId: string,
): Promise<{ key: string; id: string } | null> {
  try {
    const admin = createAdminClient()
    const apiKey = generateApiKey()
    const { data, error } = await admin.rpc("rotate_api_key", {
      p_old_key_id: keyId,
      p_organization_id: organizationId,
      p_user_id: userId,
      p_new_key_hash: hashApiKey(apiKey),
    })

    if (error || typeof data !== "string") {
      console.error("[api-keys] rotate failed", error?.code ?? "missing-result")
      return null
    }

    return { key: apiKey, id: data }
  } catch (error) {
    console.error("[api-keys] rotate failed", error instanceof Error ? error.name : "unknown")
    return null
  }
}

export async function revokeApiKey(keyId: string, organizationId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("api_keys")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", keyId)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .select("id")
      .maybeSingle()

    if (error || !data) return false
    return true
  } catch (error) {
    console.error("[api-keys] revoke failed", error instanceof Error ? error.name : "unknown")
    return false
  }
}

export async function listApiKeys(organizationId: string): Promise<ApiKeyRecord[] | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("api_keys")
      .select("id, name, is_active, created_at, last_used_at, expires_at, quota_daily, quota_monthly")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[api-keys] list failed", error.code)
      return null
    }

    const now = new Date()
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      .toISOString()
      .slice(0, 10)
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10)
    const keyIds = (data ?? []).map((key) => key.id)

    const { data: counters, error: counterError } = keyIds.length
      ? await admin
          .from("api_quota_counters")
          .select("api_key_id, period_type, period_start, usage_count")
          .in("api_key_id", keyIds)
          .in("period_type", ["day", "month"])
          .in("period_start", [dayStart, monthStart])
      : { data: [], error: null }

    if (counterError) {
      console.error("[api-keys] counter read failed", counterError.code)
      return null
    }

    const usage = new Map<string, { day: number; month: number }>()
    for (const counter of counters ?? []) {
      const current = usage.get(counter.api_key_id) ?? { day: 0, month: 0 }
      if (counter.period_type === "day" && counter.period_start === dayStart) current.day = counter.usage_count
      if (counter.period_type === "month" && counter.period_start === monthStart) current.month = counter.usage_count
      usage.set(counter.api_key_id, current)
    }

    return (data ?? []).map((key) => ({
      ...key,
      quota_daily: key.quota_daily ?? DEFAULT_API_KEY_DAILY_QUOTA,
      quota_monthly: key.quota_monthly ?? DEFAULT_API_KEY_MONTHLY_QUOTA,
      usage_today: usage.get(key.id)?.day ?? 0,
      usage_month: usage.get(key.id)?.month ?? 0,
    }))
  } catch (error) {
    console.error("[api-keys] list failed", error instanceof Error ? error.name : "unknown")
    return null
  }
}
