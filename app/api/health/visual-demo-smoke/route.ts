import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin
    const imageResponse = await fetch(`${origin}/images/legal-protection-icon.jpg`, { cache: "no-store" })
    if (!imageResponse.ok) {
      return NextResponse.json({ ok: false, stage: "image", status: imageResponse.status }, { status: 502 })
    }

    const imageBase64 = Buffer.from(await imageResponse.arrayBuffer()).toString("base64")
    const previewResponse = await fetch(`${origin}/api/v1/public/trademark-preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "videntia-real-visual-smoke/1.0",
      },
      body: JSON.stringify({ image: `data:image/jpeg;base64,${imageBase64}` }),
      cache: "no-store",
    })
    const payload = await previewResponse.json().catch(() => ({}))

    return NextResponse.json({
      ok: previewResponse.ok,
      status: previewResponse.status,
      analysis_mode: payload.analysis_mode ?? null,
      marca: payload.marca ?? null,
      denomination_source: payload.denomination_source ?? null,
      denomination_confidence: payload.denomination_confidence ?? null,
      visual: payload.visual ?? null,
      resultados_totales: payload.evidencia?.resultados_totales ?? null,
      estrategias_ejecutadas: payload.busqueda?.estrategias_ejecutadas ?? null,
      advertencias: payload.evidencia?.advertencias ?? null,
      lectura: payload.lectura ?? null,
      error: payload.error ?? null,
    }, {
      status: previewResponse.ok ? 200 : 502,
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
