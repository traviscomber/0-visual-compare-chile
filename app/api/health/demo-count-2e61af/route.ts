import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const response = await fetch(new URL("/api/v1/public/trademark-preview", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "videntia-production-count-check/1.0",
    },
    body: JSON.stringify({ nombre: "VIDENTIA" }),
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)
  const body = payload && typeof payload === "object" ? payload as Record<string, unknown> : {}
  const evidencia = body.evidencia && typeof body.evidencia === "object" ? body.evidencia as Record<string, unknown> : {}
  const antecedentes = Array.isArray(body.antecedentes) ? body.antecedentes : []

  return NextResponse.json({
    ok: response.ok,
    status: response.status,
    resultados: typeof evidencia.resultados_totales === "number" ? evidencia.resultados_totales : null,
    visibles: antecedentes.length,
    adicionales: typeof body.locked_count === "number" ? body.locked_count : null,
    fuente: typeof evidencia.fuente === "string" ? evidencia.fuente : null,
    fuenteOficial: typeof evidencia.fuente_oficial === "string" ? evidencia.fuente_oficial : null,
    metodo: typeof evidencia.metodo === "string" ? evidencia.metodo : null,
  }, {
    status: response.ok ? 200 : 503,
    headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" },
  })
}
