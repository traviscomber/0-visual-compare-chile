import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createApiKey, listApiKeys } from "@/lib/api/key-management"

export const runtime = "nodejs"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const keys = await listApiKeys(user.id)
    if (!keys) {
      return NextResponse.json({ error: "Failed to load API keys" }, { status: 500 })
    }

    return NextResponse.json({ keys: keys ?? [] }, { status: 200 })
  } catch (error) {
    console.error("[v0] List api keys error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const expiresAtValue = typeof body?.expiresAt === "string" ? body.expiresAt.trim() : ""
    const expiresAt = expiresAtValue ? new Date(expiresAtValue) : undefined

    if (!name) {
      return NextResponse.json({ error: "API key name is required" }, { status: 400 })
    }

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Invalid expiration date" }, { status: 400 })
    }

    const created = await createApiKey(user.id, user.id, name, expiresAt)
    if (!created) {
      return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
    }

    return NextResponse.json({ key: created.key, id: created.id }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create api key error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
