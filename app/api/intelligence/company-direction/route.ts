import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildCompanyDirection } from "@/lib/intelligence/company-direction"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const QuerySchema = z.object({
  q: z.string().trim().min(2).max(160),
  identityId: z.string().uuid().optional(),
})

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    identityId: url.searchParams.get("identityId") || undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ingresa una empresa o titular válido." },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }

  try {
    const result = await buildCompanyDirection(
      createAdminClient(),
      parsed.data.q,
      parsed.data.identityId,
    )
    return NextResponse.json(result, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[company-direction]", error)
    return NextResponse.json(
      { error: "No pudimos construir la comparación semestral de esta empresa." },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }
}
