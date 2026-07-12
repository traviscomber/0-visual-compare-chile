import { NextResponse } from "next/server"
import { authenticateApiKey } from "@/lib/api/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
    const { data: comparison, error } = await admin
      .from("comparisons")
      .select("*")
      .eq("id", id)
      .eq("organization_id", context.organization_id)
      .single()

    if (error || !comparison) {
      return NextResponse.json({ error: "Comparison not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: comparison }, { status: 200 })
  } catch (error) {
    console.error("[v0] get comparison error", error)
    return NextResponse.json({ error: "Failed to fetch comparison" }, { status: 500 })
  }
}
