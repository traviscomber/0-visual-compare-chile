/**
 * POST /api/v1/agent/analyze
 * Pipeline interno: denominacion visual -> Viena -> Niza -> conflictos -> INAPI -> informe ejecutivo.
 */

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { TrademarkAgent } from "@/lib/agent/trademark-agent"
import { isFreeAccessUser } from "@/lib/free-research-quota"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

const MAX_NAME_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 2_000
const MAX_IMAGE_BASE64_LENGTH = 6 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])

const DetectedNameSchema = z.object({
  denominacion: z.string().nullable(),
  confidence: z.number().min(0).max(1),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: noStoreHeaders() })
  }

  if (isFreeAccessUser(user)) {
    return NextResponse.json(
      {
        error: "La evaluación asistida, recomendaciones y análisis de conflicto están disponibles sólo para acceso empresarial.",
        code: "ENTERPRISE_ACCESS_REQUIRED",
      },
      { status: 403, headers: noStoreHeaders() },
    )
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[trademark-agent] OPENAI_API_KEY missing")
      return NextResponse.json({ error: "Servicio de análisis no disponible." }, { status: 503, headers: noStoreHeaders() })
    }

    const payload = await readPayload(request)
    const descripcion = payload.descripcion.trim()
    const industria = payload.industria.trim()

    if (payload.nombre.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.` }, { status: 400, headers: noStoreHeaders() })
    }
    if (descripcion.length > MAX_DESCRIPTION_LENGTH || industria.length > 240) {
      return NextResponse.json({ error: "Los campos de contexto exceden el largo permitido." }, { status: 400, headers: noStoreHeaders() })
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

    let nombre = payload.nombre.trim()
    let detectedNameConfidence: number | null = null
    if (!nombre && cleanImage && imageMimeType) {
      const detected = await detectTrademarkName(cleanImage, imageMimeType)
      nombre = detected.denominacion?.trim().slice(0, MAX_NAME_LENGTH) ?? ""
      detectedNameConfidence = detected.confidence
    }

    if (!nombre) {
      return NextResponse.json({
        error: cleanImage
          ? "No pudimos leer una denominación clara en la imagen. Escribe el nombre de la marca para continuar."
          : "Sube una imagen o escribe el nombre de la marca.",
      }, { status: 400, headers: noStoreHeaders() })
    }

    const { data: cachedComparison } = !payload.image.trim()
      ? await supabase
          .from("comparisons")
          .select("id, result_data")
          .eq("user_id", user.id)
          .eq("result_data->>marca", nombre)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null }

    if (cachedComparison?.result_data) {
      return NextResponse.json(
        { ...cachedComparison.result_data, comparison_id: cachedComparison.id, cached: true },
        { status: 200, headers: noStoreHeaders() },
      )
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
        similarity_score: 0,
        classification: report.informe.nivel_riesgo_global,
        signals: {
          source: "trademark-agent",
          pipeline_ms: report.pipeline_ms,
          ai_cost_usd: report.costo_estimado_usd,
          ai_tokens: report.tokens_totales,
          ai_max_tier: report.routing.max_tier_used,
          ai_escalated: report.routing.escalated,
          niza_model: report.niza.model_used,
          viena_model: report.viena.model_used,
          report_model: report.routing.report.final_model,
          denomination_source: payload.nombre.trim() ? "user" : "image-detected",
          denomination_confidence: detectedNameConfidence,
        },
        recommendation: report.registrabilidad?.recomendacion ?? report.informe.recomendaciones?.[0] ?? null,
        result_data: { ...report, marca: nombre },
        result_json: { ...report, marca: nombre },
        brand_context: {
          marca: nombre,
          descripcion: descripcion || null,
          industria: industria || null,
          source: "trademark-agent",
          denomination_source: payload.nombre.trim() ? "user" : "image-detected",
          denomination_confidence: detectedNameConfidence,
        },
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
      denominationSource: payload.nombre.trim() ? "user" : "image-detected",
      aiCostUsd: report.costo_estimado_usd,
      aiTokens: report.tokens_totales,
      aiMaxTier: report.routing.max_tier_used,
      aiEscalated: report.routing.escalated,
    })

    return NextResponse.json({
      ...report,
      comparison_id: savedComparison.id,
      denomination_source: payload.nombre.trim() ? "user" : "image-detected",
      denomination_confidence: detectedNameConfidence,
    }, { status: 200, headers: noStoreHeaders() })
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
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: noStoreHeaders() })
  if (isFreeAccessUser(user)) {
    return NextResponse.json(
      { error: "El análisis asistido requiere acceso empresarial.", code: "ENTERPRISE_ACCESS_REQUIRED" },
      { status: 403, headers: noStoreHeaders() },
    )
  }

  return NextResponse.json({
    endpoint: "POST /api/v1/agent/analyze",
    status: process.env.OPENAI_API_KEY ? "available" : "unavailable",
    pipeline: ["denominacion-visual", "viena", "niza", "conflictos", "inapi", "informe"],
    aiRouting: ["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"],
    maxDurationSeconds: 60,
  }, { headers: noStoreHeaders() })
}

async function detectTrademarkName(imageBase64: string, imageMimeType: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.chat.completions.parse({
    model: "gpt-5.6-luna",
    max_completion_tokens: 160,
    messages: [
      {
        role: "system",
        content: "Identifica únicamente la denominación marcaria visible y principal de la imagen. No inventes texto. Si no hay texto suficientemente claro, devuelve null. Ignora slogans secundarios, etiquetas legales, precios y texto ambiental.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Lee la denominación principal de esta marca o logo." },
          { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${imageBase64}`, detail: "low" } },
        ],
      },
    ],
    response_format: zodResponseFormat(DetectedNameSchema, "detected_trademark_name"),
  })

  return response.choices[0]?.message.parsed ?? { denominacion: null, confidence: 0 }
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
