import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

async function imageData(origin: string, path: string) {
  const response = await fetch(`${origin}${path}`, { cache: "no-store" })
  if (!response.ok) throw new Error(`asset ${path} -> ${response.status}`)
  const base64 = Buffer.from(await response.arrayBuffer()).toString("base64")
  return `data:image/jpeg;base64,${base64}`
}

async function postPreview(origin: string, body: Record<string, unknown>, userAgent: string) {
  const response = await fetch(`${origin}/api/v1/public/trademark-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => ({}))
  return { status: response.status, ok: response.ok, payload }
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin
    const textImage = await imageData(origin, "/images/legal-protection-icon.jpg")
    const textlessImage = await imageData(origin, "/images/fraud-detection-icon.jpg")

    const mixed = await postPreview(origin, {
      image: textImage,
      actividad: "servicios jurídicos, asesoría legal y representación de clientes",
    }, "videntia-qa-mixed/1.0")

    const userOverride = await postPreview(origin, {
      nombre: "VIDENTIA",
      image: textImage,
      actividad: "software para análisis, búsqueda y vigilancia de marcas comerciales",
    }, "videntia-qa-user-override/1.0")

    const visualOnly = await postPreview(origin, {
      image: textlessImage,
    }, "videntia-qa-visual-only/1.0")

    const invalidMime = await postPreview(origin, {
      image: "data:text/plain;base64,SG9sYQ==",
    }, "videntia-qa-invalid-mime/1.0")

    const summary = {
      mixed: {
        status: mixed.status,
        mode: mixed.payload.analysis_mode ?? null,
        marca: mixed.payload.marca ?? null,
        source: mixed.payload.denomination_source ?? null,
        confidence: mixed.payload.denomination_confidence ?? null,
        niza: (mixed.payload.niza ?? []).map((item: { numero?: string }) => item.numero),
        vienaCount: mixed.payload.visual?.viena?.length ?? 0,
        resultados: mixed.payload.evidencia?.resultados_totales ?? null,
        estrategias: mixed.payload.busqueda?.estrategias_ejecutadas ?? null,
        error: mixed.payload.error ?? null,
      },
      userOverride: {
        status: userOverride.status,
        mode: userOverride.payload.analysis_mode ?? null,
        marca: userOverride.payload.marca ?? null,
        source: userOverride.payload.denomination_source ?? null,
        niza: (userOverride.payload.niza ?? []).map((item: { numero?: string }) => item.numero),
        vienaCount: userOverride.payload.visual?.viena?.length ?? 0,
        resultados: userOverride.payload.evidencia?.resultados_totales ?? null,
        error: userOverride.payload.error ?? null,
      },
      visualOnly: {
        status: visualOnly.status,
        mode: visualOnly.payload.analysis_mode ?? null,
        marca: visualOnly.payload.marca ?? null,
        source: visualOnly.payload.denomination_source ?? null,
        confidence: visualOnly.payload.denomination_confidence ?? null,
        vienaCount: visualOnly.payload.visual?.viena?.length ?? 0,
        elementos: visualOnly.payload.visual?.elementos ?? [],
        resultados: visualOnly.payload.evidencia?.resultados_totales ?? null,
        estrategias: visualOnly.payload.busqueda?.estrategias_ejecutadas ?? null,
        error: visualOnly.payload.error ?? null,
      },
      invalidMime: {
        status: invalidMime.status,
        error: invalidMime.payload.error ?? null,
      },
    }

    const assertions = {
      mixedDetectsName: mixed.ok && mixed.payload.analysis_mode === "trademark" && mixed.payload.denomination_source === "image-detected" && Boolean(mixed.payload.marca),
      mixedUsesNizaContext: mixed.ok && mixed.payload.niza_context_provided === true && (mixed.payload.niza?.length ?? 0) > 0,
      mixedHasVisualSignals: mixed.ok && (mixed.payload.visual?.viena?.length ?? 0) > 0,
      overrideRespectsUserName: userOverride.ok && userOverride.payload.marca === "VIDENTIA" && userOverride.payload.denomination_source === "user",
      overrideUsesNizaContext: userOverride.ok && userOverride.payload.niza_context_provided === true && (userOverride.payload.niza?.length ?? 0) > 0,
      visualOnlyDoesNotInventName: visualOnly.ok && visualOnly.payload.analysis_mode === "visual-only" && visualOnly.payload.denomination_source === "not-detected" && visualOnly.payload.denomination_confidence === null,
      visualOnlyHasSignals: visualOnly.ok && (visualOnly.payload.visual?.viena?.length ?? 0) > 0 && visualOnly.payload.busqueda?.estrategias_ejecutadas === 0,
      invalidMimeRejected: invalidMime.status === 415,
    }

    return NextResponse.json({
      ok: Object.values(assertions).every(Boolean),
      ran_at: new Date().toISOString(),
      assertions,
      summary,
    }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
