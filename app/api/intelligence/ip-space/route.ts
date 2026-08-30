import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { buildIpSpaceAnalysis } from "@/lib/intelligence/ip-space"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const QuerySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("patent"), code: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9./ -]+$/) }),
  z.object({ type: z.literal("trademark"), code: z.string().trim().regex(/^\d{1,2}$/).refine(value => Number(value) >= 1 && Number(value) <= 45) }),
])

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    type: url.searchParams.get("type") ?? "",
    code: url.searchParams.get("code") ?? "",
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ingresa una clasificación IPC o Niza válida." },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }

  try {
    const result = await buildIpSpaceAnalysis(createAdminClient(), parsed.data.type, parsed.data.code)
    return NextResponse.json(result, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[ip-space]", error)
    return NextResponse.json(
      { error: "No pudimos analizar este espacio competitivo." },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }
}
