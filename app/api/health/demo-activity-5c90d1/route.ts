import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  const response = await fetch(new URL("/api/v1/public/trademark-preview", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "videntia-production-activity-check/1.0",
    },
    body: JSON.stringify({
      nombre: "VIDENTIA",
      actividad: "software para análisis, búsqueda y vigilancia de marcas comerciales",
    }),
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)
  const body = payload && typeof payload === "object" ? payload as Record<string, unknown> : {}
  const evidencia = body.evidencia && typeof body.evidencia === "object" ? body.evidencia as Record<string, unknown> : {}
  const niza = Array.isArray(body.niza) ? body.niza : []

  return NextResponse.json({
    ok: response.ok,
    upstreamStatus: response.status,
    elapsedMs: Date.now() - startedAt,
    marca: typeof body.marca === "string" ? body.marca : null,
    resultados: typeof evidencia.resultados_totales === "number" ? evidencia.resultados_totales : null,
    nizaContextProvided: body.niza_context_provided === true,
    niza: niza.slice(0, 5),
    error: typeof body.error === "string" ? body.error : null,
  }, {
    status: response.ok ? 200 : 503,
    headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" },
  })
}
