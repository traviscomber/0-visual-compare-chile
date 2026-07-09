import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revokeApiKey } from "@/lib/api/key-management"

export const runtime = "nodejs"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Missing key id" }, { status: 400 })
    }

    const success = await revokeApiKey(id, user.id)
    if (!success) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Revoke api key error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
