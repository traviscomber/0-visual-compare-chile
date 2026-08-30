import { createHmac } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env"

const DEMO_WINDOW_SECONDS = 60 * 60
const DEMO_LIMITS = {
  trademark: 1,
  patent: 3,
} as const

export type PublicDemoScope = keyof typeof DEMO_LIMITS

type DemoQuotaRow = {
  allowed: boolean
  request_count: number
  remaining: number
  reset_at: string
}

export type DemoQuotaResult =
  | { ok: true; allowed: boolean; remaining: number; resetAt: string; limit: number }
  | { ok: false }

export async function reservePublicDemoQuota(clientIdentity: string, scope: PublicDemoScope): Promise<DemoQuotaResult> {
  try {
    const limit = DEMO_LIMITS[scope]
    const clientKey = createHmac("sha256", getSupabaseServiceRoleKey())
      .update(`${scope}|${clientIdentity}`)
      .digest("hex")

    const admin = createAdminClient()
    const { data, error } = await admin.rpc("reserve_public_demo_quota", {
      p_client_key: clientKey,
      p_limit: limit,
      p_window_seconds: DEMO_WINDOW_SECONDS,
    })

    const row = (Array.isArray(data) ? data[0] : data) as DemoQuotaRow | null
    if (error || !row) return { ok: false }

    return {
      ok: true,
      allowed: row.allowed,
      remaining: row.remaining,
      resetAt: row.reset_at,
      limit,
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

export function getPublicDemoRateHeaders(result: { remaining: number; resetAt: string; limit: number }) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(result.remaining, 0)),
    "X-RateLimit-Reset": String(Math.floor(new Date(result.resetAt).getTime() / 1000)),
  }
}
