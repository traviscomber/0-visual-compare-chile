import { createHmac } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env"

const DEMO_LIMIT = 3
const DEMO_WINDOW_SECONDS = 60 * 60

type DemoQuotaRow = {
  allowed: boolean
  request_count: number
  remaining: number
  reset_at: string
}

export type DemoQuotaResult =
  | { ok: true; allowed: boolean; remaining: number; resetAt: string }
  | { ok: false }

export async function reservePublicDemoQuota(clientIdentity: string): Promise<DemoQuotaResult> {
  try {
    const clientKey = createHmac("sha256", getSupabaseServiceRoleKey())
      .update(clientIdentity)
      .digest("hex")

    const admin = createAdminClient()
    const { data, error } = await admin.rpc("reserve_public_demo_quota", {
      p_client_key: clientKey,
      p_limit: DEMO_LIMIT,
      p_window_seconds: DEMO_WINDOW_SECONDS,
    })

    const row = (Array.isArray(data) ? data[0] : data) as DemoQuotaRow | null
    if (error || !row) return { ok: false }

    return {
      ok: true,
      allowed: row.allowed,
      remaining: row.remaining,
      resetAt: row.reset_at,
    }
  } catch {
    return { ok: false }
  }
}

export function getPublicDemoIdentity(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwarded || headers.get("x-real-ip") || "unknown"
  const userAgent = headers.get("user-agent") || "unknown"
  return `${ip}|${userAgent}`
}

export function getPublicDemoRateHeaders(result: { remaining: number; resetAt: string }) {
  return {
    "X-RateLimit-Limit": String(DEMO_LIMIT),
    "X-RateLimit-Remaining": String(Math.max(result.remaining, 0)),
    "X-RateLimit-Reset": String(Math.floor(new Date(result.resetAt).getTime() / 1000)),
  }
}
