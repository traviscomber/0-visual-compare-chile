import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { TrademarkAgent } from "@/lib/agent/trademark-agent"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

const MAX_NAME_LENGTH = 120
const MAX_IMAGE_BASE64_LENGTH = 6 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])
const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 3

const buckets = new Map<string, { count: number; resetAt: number }>()

const DetectedNameSchema = z.object({
  denominacion: z.string().nullable(),
  confidence: z.number().min(0).max(1),
})

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request)
  if (!consumeRateLimit(clientKey)) {
    return NextResponse.json(
      { error: "Alcanzaste el límite de demostraciones por hora. Inicia sesión para continuar investigando." },
      { status: 429, headers: previewHeaders() },
    )
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "La demostración no está disponible en este momento." }, { status: 503, headers: previewHeaders() })
    }

    const body = await request.json()
    const rawName = typeof body.nombre === "string" ? body.nombre.trim() : ""
    const image = typeof body.image === "string" ? body.image.trim() : ""

    if (rawName.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.` }, { status: 400, headers: previewHeaders() })
    }
    if (!rawName && !image) {
      return NextResponse.json({ error: "Sube una imagen o escribe el nombre de la marca." }, { status: 400, headers: previewHeaders() })
    }

    let cleanImage: string | undefined
    let imageMimeType: string | undefined
    if (image) {
      const mimeMatch = image.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)
      imageMimeType = (mimeMatch?.[1] ?? "").toLowerCase()
      if (!ALLOWED_IMAGE_TYPES.has(imageMimeType)) {
        return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 415, headers: previewHeaders() })
      }
      cleanImage = image.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "")
      if (!/^[a-z0-9+/=\r\n]+$/i.test(cleanImage) || cleanImage.length > MAX_IMAGE_BASE64_LENGTH) {
        return NextResponse.json({ error: "La imagen no es válida o supera el máximo aproximado de 4,5 MB." }, { status: 400, headers: previewHeaders() })
      }
    }

    let nombre = rawName
    let denominationConfidence: number | null = null
    if (!nombre && cleanImage && imageMimeType) {
      const detected = await detectTrademarkName(cleanImage, imageMimeType)
      nombre = detected.denominacion?.trim().slice(0, MAX_NAME_LENGTH) ?? ""
      denominationConfidence = detected.confidence
    }

    if (!nombre) {
      return NextResponse.json({
        error: "No pudimos leer una denominación clara en la imagen. Escribe el nombre para completar la búsqueda.",
        needs_name: true,
      }, { status: 400, headers: previewHeaders() })
    }

    const agent = new TrademarkAgent()
    const report = await agent.analyze({
      imageBase64: cleanImage,
      imageMimeType,
      nombreMarca: nombre,
    })

    const antecedentes = (report.registrabilidad?.antecedentes ?? []).slice(0, 4).map((item) => ({
      id: item.id,
      nombre: item.nombre,
      titular: item.solicitante,
      estado: item.estado,
      clases: item.clases,
      numero_registro: item.numero_registro,
      numero_solicitud: item.numero_solicitud,
      relevancia: item.puntaje_relevancia,
      razones: item.razones.slice(0, 3),
    }))

    return NextResponse.json({
      marca: nombre,
      denomination_source: rawName ? "user" : "image-detected",
      denomination_confidence: denominationConfidence,
      visual: {
        elementos: report.viena.elementos_detectados.slice(0, 6),
        colores: report.viena.colores_dominantes.slice(0, 5),
        viena: report.viena.codes.slice(0, 5).map((code) => ({ code: code.code, elemento: code.elemento, confidence: code.confidence })),
      },
      niza: report.niza.clases.slice(0, 5).map((item) => ({ numero: item.numero, titulo: item.titulo, tipo: item.tipo, razon: item.razon })),
      evidencia: {
        fuente: "INAPI",
        consultado_en: report.registrabilidad?.fuente.consultado_en ?? report.timestamp,
        resultados_totales: report.registrabilidad?.calidad.resultados_totales ?? 0,
        resultados_activos: report.registrabilidad?.calidad.resultados_activos ?? 0,
        confianza: report.registrabilidad?.calidad.confianza ?? "baja",
        advertencias: report.registrabilidad?.calidad.advertencias ?? [],
      },
      lectura: {
        nivel: report.informe.nivel_riesgo_global,
        resumen: report.informe.resumen_ejecutivo,
        recomendacion: report.registrabilidad?.recomendacion ?? report.informe.recomendaciones[0] ?? "Revisar antecedentes antes de decidir.",
      },
      antecedentes,
      preview: true,
      locked_count: Math.max(0, (report.registrabilidad?.antecedentes.length ?? 0) - antecedentes.length),
    }, { headers: previewHeaders() })
  } catch (error) {
    console.error("[public-trademark-preview] failed", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "No fue posible completar la demostración." }, { status: 500, headers: previewHeaders() })
  }
}

async function detectTrademarkName(imageBase64: string, imageMimeType: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.chat.completions.parse({
    model: "gpt-5.6-luna",
    max_completion_tokens: 160,
    messages: [
      {
        role: "system",
        content: "Identifica únicamente la denominación marcaria visible y principal. No inventes texto. Si no hay texto suficientemente claro, devuelve null. Ignora slogans secundarios, etiquetas legales, precios y texto ambiental.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Lee la denominación principal de esta marca o logo." },
          { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${imageBase64}`, detail: "low" } },
        ],
      },
    ],
    response_format: zodResponseFormat(DetectedNameSchema, "public_detected_trademark_name"),
  })
  return response.choices[0]?.message.parsed ?? { denominacion: null, confidence: 0 }
}

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || request.headers.get("x-real-ip") || "anonymous"
}

function consumeRateLimit(key: string) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false
  current.count += 1
  return true
}

function previewHeaders() {
  return {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  }
}
