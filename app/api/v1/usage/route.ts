import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authenticateApiKey } from "@/lib/api/auth"

export const runtime = "nodejs"

interface UsageStats {
  uploads_today: number
  uploads_month: number
  comparisons_today: number
  comparisons_month: number
  storage_gb: number
  api_calls_today: number
  api_calls_month: number
  period: {
    start_date: string
    end_date: string
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.slice(7)
    const context = await authenticateApiKey(apiKey)
    if (!context) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const admin = createAdminClient()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get upload count today
    const { count: uploadsToday } = await admin
      .from("images")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", today.toISOString())

    // Get upload count this month
    const { count: uploadsMonth } = await admin
      .from("images")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", monthStart.toISOString())

    // Get comparison count today
    const { count: comparisonsToday } = await admin
      .from("comparisons")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", today.toISOString())

    // Get comparison count this month
    const { count: comparisonsMonth } = await admin
      .from("comparisons")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", monthStart.toISOString())

    // Get total storage used
    const { data: images } = await admin
      .from("images")
      .select("size_bytes")
      .eq("organization_id", context.organization_id)

    const storageBytes = images?.reduce((acc, img) => acc + (img.size_bytes || 0), 0) || 0
    const storageGb = storageBytes / (1024 * 1024 * 1024)

    // Get API calls today
    const { count: apiCallsToday } = await admin
      .from("usage_logs")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", today.toISOString())

    // Get API calls this month
    const { count: apiCallsMonth } = await admin
      .from("usage_logs")
      .select("*", { count: "exact" })
      .eq("organization_id", context.organization_id)
      .gte("created_at", monthStart.toISOString())

    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const stats: UsageStats = {
      uploads_today: uploadsToday || 0,
      uploads_month: uploadsMonth || 0,
      comparisons_today: comparisonsToday || 0,
      comparisons_month: comparisonsMonth || 0,
      storage_gb: Math.round(storageGb * 100) / 100,
      api_calls_today: apiCallsToday || 0,
      api_calls_month: apiCallsMonth || 0,
      period: {
        start_date: monthStart.toISOString(),
        end_date: monthEnd.toISOString(),
      },
    }

    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    console.error("[v0] Usage error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
