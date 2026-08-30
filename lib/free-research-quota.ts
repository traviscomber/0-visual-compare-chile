import type { User } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

export const FREE_MONTHLY_RESEARCH_LIMIT = 3

type FreeResearchQuota =
  | { ok: true; allowed: boolean; used: number; remaining: number; resetsAt: string }
  | { ok: false }

export function isFreeAccessUser(user: User) {
  return user.user_metadata?.access_tier === "free"
}

export async function getFreeResearchQuota(userId: string): Promise<FreeResearchQuota> {
  try {
    const now = new Date()
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    const admin = createAdminClient()
    const { count, error } = await admin
      .from("search_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "success")
      .gte("created_at", periodStart.toISOString())
      .lt("created_at", nextMonth.toISOString())

    if (error) return { ok: false }

    const used = count ?? 0
    return {
      ok: true,
      allowed: used < FREE_MONTHLY_RESEARCH_LIMIT,
      used,
      remaining: Math.max(FREE_MONTHLY_RESEARCH_LIMIT - used, 0),
      resetsAt: nextMonth.toISOString(),
    }
  } catch {
    return { ok: false }
  }
}

export function getFreeResearchQuotaHeaders(quota: { remaining: number; resetsAt: string }) {
  return {
    "X-Free-Research-Limit": String(FREE_MONTHLY_RESEARCH_LIMIT),
    "X-Free-Research-Remaining": String(Math.max(quota.remaining, 0)),
    "X-Free-Research-Reset": String(Math.floor(new Date(quota.resetsAt).getTime() / 1000)),
  }
}
