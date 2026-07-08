import { createAdminClient } from "@/lib/supabase/admin"

export interface ApiKeyContext {
  organization_id: string
  user_id: string
  api_key: string
}

export async function authenticateApiKey(apiKey: string): Promise<ApiKeyContext | null> {
  if (!apiKey) return null

  try {
    const admin = createAdminClient()
    
    // Query api_keys table for valid key
    const { data, error } = await admin
      .from("api_keys")
      .select("*")
      .eq("key_hash", hashApiKey(apiKey))
      .eq("is_active", true)
      .single()

    if (error || !data) return null

    // Check if key has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null
    }

    // Update last_used_at
    await admin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id)

    return {
      organization_id: data.organization_id,
      user_id: data.user_id,
      api_key: apiKey,
    }
  } catch (error) {
    console.error("[v0] API key authentication error:", error)
    return null
  }
}

export function hashApiKey(key: string): string {
  const crypto = require("crypto")
  return crypto.createHash("sha256").update(key).digest("hex")
}

export function generateApiKey(): string {
  const crypto = require("crypto")
  return `sc_${crypto.randomBytes(32).toString("hex")}`
}
