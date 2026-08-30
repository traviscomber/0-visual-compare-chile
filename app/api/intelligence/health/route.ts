import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { buildIntelligenceHealth } from "@/lib/intelligence/health"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 15

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  try {
    const result = await buildIntelligenceHealth(createAdminClient())
    return NextResponse.json(result, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[intelligence-health]", error)
    return NextResponse.json(
      { error: "No pudimos construir el estado de las fuentes." },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }
}
