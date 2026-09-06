import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const JUAN_EMAIL = "juan@n3uralia.com"

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  if (auth.user.email?.trim().toLowerCase() !== JUAN_EMAIL) {
    return NextResponse.json({ error: "Esta investigación está reservada al propietario de esta bandeja." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "El motor de investigación no está configurado." }, { status: 503, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const target = new URL("/api/cron/juan-research-frontier", request.url)
  const response = await fetch(target, {
    method: "GET",
    headers: { authorization: `Bearer ${secret}` },
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    console.error("[product-evolution-refresh]", payload)
    return NextResponse.json({ error: payload?.error || "No pudimos actualizar la frontera mundial." }, { status: response.status || 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json(payload, { headers: PRIVATE_NO_STORE_HEADERS })
}
