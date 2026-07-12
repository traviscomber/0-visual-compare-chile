import { NextResponse } from "next/server"
import { authenticateApiKey } from "@/lib/api/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

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

    const url = new URL(request.url)
    const parsedLimit = Number(url.searchParams.get("limit") || "50")
    const parsedOffset = Number(url.searchParams.get("offset") || "0")
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50
    const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0

    const admin = createAdminClient()
    const { data: comparisons, error } = await admin
      .from("comparisons")
      .select("*")
      .eq("organization_id", context.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[v0] comparisons query error", error)
      return NextResponse.json({ error: "Failed to fetch comparisons" }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: comparisons ?? [],
        limit,
        offset,
        count: comparisons?.length ?? 0,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] comparisons list error", error)
    return NextResponse.json({ error: "Failed to fetch comparisons" }, { status: 500 })
  }
}
