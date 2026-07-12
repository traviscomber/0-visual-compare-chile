import { NextResponse } from "next/server"
import { createApiKey, listApiKeys } from "@/lib/api/key-management"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

async function logUsage(userId: string, action: string, metadata: Record<string, unknown>) {
  const supabase = await createClient()

  await supabase.from("usage_logs").insert({
    user_id: userId,
    organization_id: userId,
    action,
    metadata,
  })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const keys = await listApiKeys(user.id)
    if (!keys) {
      return NextResponse.json({ error: "No fue posible cargar las claves API." }, { status: 500 })
    }

    return NextResponse.json({ keys }, { status: 200 })
  } catch (error) {
    console.error("[v0] list api keys error", error)
    return NextResponse.json({ error: "Error interno al cargar las claves API." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const expiresAtValue = typeof body?.expiresAt === "string" ? body.expiresAt.trim() : ""
    const expiresAt = expiresAtValue ? new Date(expiresAtValue) : undefined

    if (!name) {
      return NextResponse.json({ error: "Debes indicar un nombre para la clave." }, { status: 400 })
    }

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "La fecha de expiracion no es valida." }, { status: 400 })
    }

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "La fecha de expiracion debe ser futura." }, { status: 400 })
    }

    const created = await createApiKey(user.id, user.id, name, expiresAt)
    if (!created) {
      return NextResponse.json({ error: "No fue posible crear la clave API." }, { status: 500 })
    }

    await logUsage(user.id, "api_key.created", {
      api_key_id: created.id,
      name,
      expires_at: expiresAt?.toISOString() ?? null,
    })

    return NextResponse.json({ key: created.key, id: created.id }, { status: 201 })
  } catch (error) {
    console.error("[v0] create api key error", error)
    return NextResponse.json({ error: "Error interno al crear la clave API." }, { status: 500 })
  }
}
