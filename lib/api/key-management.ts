import { createAdminClient } from "@/lib/supabase/admin"
import { generateApiKey, hashApiKey } from "@/lib/api/auth"

export async function createApiKey(
  organizationId: string,
  userId: string,
  name: string,
  expiresAt?: Date
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

export async function revokeApiKey(keyId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from("api_keys").update({ is_active: false }).eq("id", keyId)

    if (error) {
      console.error("[v0] Failed to revoke API key:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Revoke API key error:", error)
    return false
  }
}

export async function listApiKeys(organizationId: string): Promise<any[] | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("api_keys")
      .select("id, name, is_active, created_at, last_used_at, expires_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to list API keys:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("[v0] List API keys error:", error)
    return null
  }
}
