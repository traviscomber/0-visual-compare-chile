import { NextResponse } from "next/server"
import { rotateApiKey } from "@/lib/api/key-management"
import { ensureAccountBootstrap } from "@/lib/supabase/bootstrap-account"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    await ensureAccountBootstrap(user)

    const { id } = await params
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json(
        { error: "Identificador de clave inválido." },
        { status: 400, headers: PRIVATE_HEADERS },
      )
    }

    const rotated = await rotateApiKey(id, user.id, user.id)
    if (!rotated) {
      return NextResponse.json(
        { error: "No encontramos una clave activa para rotar." },
        { status: 404, headers: PRIVATE_HEADERS },
      )
    }

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      organization_id: null,
      action: "api_key.rotated",
      metadata: {
        previous_api_key_id: id,
        target_api_key_id: rotated.id,
      },
    })

    return NextResponse.json(
      {
        id: rotated.id,
        key: rotated.key,
        message: "Guarda esta clave ahora. No volverá a mostrarse.",
      },
      { status: 201, headers: PRIVATE_HEADERS },
    )
  } catch (error) {
    console.error("[api-keys] rotate route failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "Error interno al rotar la clave API." },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}
