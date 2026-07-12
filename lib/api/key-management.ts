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
  quotas?: { daily?: number; monthly?: number }
): Promise<{ key: string; id: string } | null> {
  try {
    const admin = createAdminClient()
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)

    const { data, error } = await admin
      .from("api_keys")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        key_hash: keyHash,
        name,
        expires_at: expiresAt?.toISOString(),
        quota_daily: quotas?.daily ?? DEFAULT_API_KEY_DAILY_QUOTA,
        quota_monthly: quotas?.monthly ?? DEFAULT_API_KEY_MONTHLY_QUOTA,
      })
      .select("id")
      .single()

    if (error || !data) {
      console.error("[v0] Failed to create API key:", error)
      return null
    }

    return { key: apiKey, id: data.id }
  } catch (error) {
    console.error("[v0] Create API key error:", error)
    return null
  }
}

export async function revokeApiKey(keyId: string, organizationId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", keyId)
      .eq("organization_id", organizationId)
      .select("id")
      .single()

    if (error || !data) {
      console.error("[v0] Failed to revoke API key:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Revoke API key error:", error)
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
      console.error("[v0] Failed to list API keys:", error)
      return null
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const keys = (data ?? []) as Array<ApiKeyRecord & { usage_today?: number; usage_month?: number }>

    const enriched = await Promise.all(
      keys.map(async (key) => {
        const [{ count: usageToday }, { count: usageMonth }] = await Promise.all([
          admin
            .from("usage_logs")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .contains("metadata", { api_key_id: key.id })
            .gte("created_at", today),
          admin
            .from("usage_logs")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .contains("metadata", { api_key_id: key.id })
            .gte("created_at", monthStart),
        ])

        return {
          ...key,
          quota_daily: key.quota_daily ?? DEFAULT_API_KEY_DAILY_QUOTA,
          quota_monthly: key.quota_monthly ?? DEFAULT_API_KEY_MONTHLY_QUOTA,
          usage_today: usageToday ?? 0,
          usage_month: usageMonth ?? 0,
        }
      }),
    )

    return enriched
  } catch (error) {
    console.error("[v0] List API keys error:", error)
    return null
  }
}
