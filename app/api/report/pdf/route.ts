import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
  }

  return NextResponse.json(
    {
      error: "La exportación PDF legacy fue retirada mientras se reemplaza por un informe VIDENTIA basado en evidencia trazable.",
      code: "LEGACY_REPORT_RETIRED",
      next: "/history",
    },
    { status: 410, headers: PRIVATE_HEADERS },
  )
}
