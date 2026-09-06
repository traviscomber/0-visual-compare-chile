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

  const chileTarget = new URL("/api/cron/juan-chile-evidence", request.url)
  const chileResponse = await fetch(chileTarget, {
    method: "GET",
    headers: { authorization: `Bearer ${secret}` },
    cache: "no-store",
  })
  const chilePayload = await chileResponse.json().catch(() => null)

  if (!chileResponse.ok || !chilePayload?.ok) {
    console.error("[product-evolution-refresh:chile]", chilePayload)
    return NextResponse.json({ error: chilePayload?.error || "No pudimos actualizar la evidencia chilena." }, { status: chileResponse.status || 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const frontierTarget = new URL("/api/cron/juan-research-frontier", request.url)
  const frontierResponse = await fetch(frontierTarget, {
    method: "GET",
    headers: { authorization: `Bearer ${secret}` },
    cache: "no-store",
  })
  const frontierPayload = await frontierResponse.json().catch(() => null)

  if (!frontierResponse.ok || !frontierPayload?.ok) {
    console.error("[product-evolution-refresh:frontier]", frontierPayload)
    return NextResponse.json({ error: frontierPayload?.error || "No pudimos actualizar la frontera mundial." }, { status: frontierResponse.status || 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({
    ok: true,
    chile: chilePayload,
    frontier: frontierPayload,
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}
