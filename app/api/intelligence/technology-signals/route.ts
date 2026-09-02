import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { buildTechnologySignals } from "@/lib/intelligence/technology-signals"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ScopeSchema = z.enum(["chile", "global", "both"])
const QuerySchema = z.object({
  q: z.string().trim().min(2).max(160),
  windowDays: z.coerce.number().int().min(30).max(730).default(180),
  scope: ScopeSchema.optional(),
})

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const cookieScope = (await cookies()).get("videntia_search_scope")?.value
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    windowDays: url.searchParams.get("windowDays") ?? 180,
    scope: url.searchParams.get("scope") ?? (ScopeSchema.safeParse(cookieScope).success ? cookieScope : "both"),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Consulta tecnológica inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  try {
    const signals = await buildTechnologySignals(parsed.data.q, parsed.data.windowDays, parsed.data.scope ?? "both")
    return NextResponse.json(signals, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[intelligence:technology-signals]", error)
    return NextResponse.json({ error: "No pudimos construir las señales tecnológicas." }, { status: 502, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
