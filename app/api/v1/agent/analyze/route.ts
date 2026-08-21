/**
 * POST /api/v1/agent/analyze
 * Pipeline interno: Viena → Niza → conflictos → INAPI → informe ejecutivo.
 */

import { NextRequest, NextResponse } from "next/server"
import { TrademarkAgent } from "@/lib/agent/trademark-agent"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

const MAX_NAME_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 2_000
const MAX_IMAGE_BASE64_LENGTH = 6 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: noStoreHeaders() })
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[trademark-agent] OPENAI_API_KEY missing")
      return NextResponse.json({ error: "Servicio de análisis no disponible." }, { status: 503, headers: noStoreHeaders() })
    }

    const payload = await readPayload(request)
    const nombre = payload.nombre.trim()
    const descripcion = payload.descripcion.trim()
    const industria = payload.industria.trim()

    if (!nombre) {
      return NextResponse.json({ error: "El campo nombre es requerido." }, { status: 400, headers: noStoreHeaders() })
    }
    if (nombre.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.` }, { status: 400, headers: noStoreHeaders() })
    }
    if (descripcion.length > MAX_DESCRIPTION_LENGTH || industria.length > 240) {
      return NextResponse.json({ error: "Los campos de contexto exceden el largo permitido." }, { status: 400, headers: noStoreHeaders() })
    }

    const { data: cachedComparison } = !payload.image.trim()
      ? await supabase
          .from("comparisons")
          .select("id, result_json")
          .eq("user_id", user.id)
          .eq("result_json->>marca", nombre)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null }

    if (cachedComparison?.result_json) {
      return NextResponse.json(
        { ...cachedComparison.result_json, comparison_id: cachedComparison.id, cached: true },
        { status: 200, headers: noStoreHeaders() },
      )
    }

    let cleanImage: string | undefined
    let imageMimeType: string | undefined
    if (payload.image.trim()) {
      const mimeMatch = payload.image.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)
      imageMimeType = (mimeMatch?.[1] ?? "image/png").toLowerCase()
      if (!ALLOWED_IMAGE_TYPES.has(imageMimeType)) {
        return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 415, headers: noStoreHeaders() })
      }
      cleanImage = payload.image.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "")
      if (!/^[a-z0-9+/=\r\n]+$/i.test(cleanImage)) {
        return NextResponse.json({ error: "La imagen no contiene base64 válido." }, { status: 400, headers: noStoreHeaders() })
      }
      if (cleanImage.length > MAX_IMAGE_BASE64_LENGTH) {
        return NextResponse.json({ error: "Imagen demasiado grande. Máximo aproximado: 4,5 MB." }, { status: 413, headers: noStoreHeaders() })
      }
    }

    const agent = new TrademarkAgent()
    const report = await agent.analyze({
      imageBase64: cleanImage,
      imageMimeType,
      nombreMarca: nombre,
      descripcion: descripcion || undefined,
      industria: industria || undefined,
      visualScore: payload.visualScore,
    })

    const { data: savedComparison, error: saveError } = await supabase
      .from("comparisons")
      .insert({
        user_id: user.id,
        similarity_score: report.registrabilidad?.calidad?.confianza ?? 0,
        classification: report.informe.nivel_riesgo_global,
        signals: { source: "trademark-agent", pipeline_ms: report.pipeline_ms },
        recommendation: report.registrabilidad?.recomendacion ?? report.informe.recomendaciones?.[0] ?? null,
        result_json: report,
      })
      .select("id")
      .single()

    if (saveError || !savedComparison) {
      console.error("[trademark-agent] persistence failed", saveError)
      return NextResponse.json({ error: "El análisis terminó, pero no pudo registrarse en la base de datos." }, { status: 503, headers: noStoreHeaders() })
    }

    console.info("[trademark-agent] completed", {
      userId: user.id,
      comparisonId: savedComparison.id,
      durationMs: report.pipeline_ms,
      risk: report.informe.nivel_riesgo_global,
      inapiConfidence: report.registrabilidad?.calidad?.confianza ?? "no-disponible",
    })

    return NextResponse.json({ ...report, comparison_id: savedComparison.id }, { status: 200, headers: noStoreHeaders() })
  } catch (error) {
    console.error("[trademark-agent] failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: "No fue posible completar el análisis." }, { status: 500, headers: noStoreHeaders() })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: noStoreHeaders() })
  }

  return NextResponse.json({
    endpoint: "POST /api/v1/agent/analyze",
    status: process.env.OPENAI_API_KEY ? "available" : "unavailable",
    pipeline: ["viena", "niza", "conflictos", "inapi", "informe"],
    maxDurationSeconds: 60,
  }, { headers: noStoreHeaders() })
}

async function readPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? ""
  let image = ""
  let nombre = ""
  let descripcion = ""
  let industria = ""
  let visualScore: number | undefined

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData()
    image = String(form.get("image") ?? "")
    nombre = String(form.get("nombre") ?? "")
    descripcion = String(form.get("descripcion") ?? "")
    industria = String(form.get("industria") ?? "")
    const rawScore = form.get("visualScore")
    if (rawScore !== null && rawScore !== "") visualScore = Number(rawScore)
  } else {
    const body = await request.json()
    image = typeof body.image === "string" ? body.image : ""
    nombre = typeof body.nombre === "string" ? body.nombre : ""
    descripcion = typeof body.descripcion === "string" ? body.descripcion : ""
    industria = typeof body.industria === "string" ? body.industria : ""
    if (body.visualScore !== undefined) visualScore = Number(body.visualScore)
  }

  if (visualScore !== undefined && (!Number.isFinite(visualScore) || visualScore < 0 || visualScore > 100)) {
    throw new Error("Invalid visual score")
  }

  return { image, nombre, descripcion, industria, visualScore }
}

function noStoreHeaders() {
  return { "Cache-Control": "private, no-store" }
}
