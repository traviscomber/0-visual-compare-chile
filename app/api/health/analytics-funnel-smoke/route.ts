import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET() {
  const host = process.env.VERCEL_URL
  if (!host) return NextResponse.json({ ok: false, error: "VERCEL_URL unavailable" }, { status: 503 })

  const startedAt = Date.now()
  const response = await fetch(`https://${host}/api/v1/public/trademark-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "VIDENTIA-QA-Analytics-Smoke" },
    body: JSON.stringify({
      nombre: "VIDENTIA QA",
      actividad: "software para análisis de datos",
    }),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null) as null | {
    analysis_mode?: string
    niza_context_provided?: boolean
    niza?: Array<{ numero?: string }>
    error?: string
  }

  const ok = response.ok
    && payload?.analysis_mode === "trademark"
    && payload?.niza_context_provided === true

  return NextResponse.json({
    ok,
    status: response.status,
    elapsed_ms: Date.now() - startedAt,
    analysis_mode: payload?.analysis_mode ?? null,
    niza_context_provided: payload?.niza_context_provided ?? null,
    niza_classes: payload?.niza?.map((item) => item.numero).filter(Boolean) ?? [],
    error: payload?.error ?? null,
  }, {
    status: ok ? 200 : 500,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" },
  })
}
