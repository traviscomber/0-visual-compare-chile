import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { buildCompanyTrajectoryAnalysis } from "@/lib/intelligence/company-trajectory"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const QuerySchema = z.object({ identityId: z.string().uuid() })

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({ identityId: url.searchParams.get("identityId") ?? "" })
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Selecciona una identidad corporativa válida." },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }

  try {
    const result = await buildCompanyTrajectoryAnalysis(createAdminClient(), parsed.data.identityId)
    return NextResponse.json(result, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[company-trajectory]", error)
    return NextResponse.json(
      { error: "No pudimos construir la trayectoria tecnológica de esta empresa." },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }
}
