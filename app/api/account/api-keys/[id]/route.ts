import { NextResponse } from "next/server"
import { revokeApiKey } from "@/lib/api/key-management"
import { ensureAccountBootstrap } from "@/lib/supabase/bootstrap-account"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    await ensureAccountBootstrap(user)

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Falta el identificador de la clave." }, { status: 400 })
    }

    const success = await revokeApiKey(id, user.id)
    if (!success) {
      return NextResponse.json({ error: "No encontramos esa clave API." }, { status: 404 })
    }

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      organization_id: user.id,
      action: "api_key.revoked",
      metadata: {
        target_api_key_id: id,
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] revoke api key error", error)
    return NextResponse.json({ error: "Error interno al revocar la clave API." }, { status: 500 })
  }
}
