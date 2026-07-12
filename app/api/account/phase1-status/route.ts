import { NextResponse } from "next/server"
import { getPhase1StatusPayload } from "@/lib/phase1-status"
import { ensureAccountBootstrap } from "@/lib/supabase/bootstrap-account"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    await ensureAccountBootstrap(user)

    const payload = await getPhase1StatusPayload(user.id)
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("[v0] phase1 status error", error)
    return NextResponse.json({ error: "No fue posible cargar el resumen de Fase 1." }, { status: 500 })
  }
}
