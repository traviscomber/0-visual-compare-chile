import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { TrademarkAgent } from "@/lib/agent/trademark-agent"
import {
  getPublicDemoIdentity,
  getPublicDemoRateHeaders,
  reservePublicDemoQuota,
} from "@/lib/public-demo-rate-limit"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

const MAX_NAME_LENGTH = 120
const MAX_ACTIVITY_LENGTH = 400
const MAX_IMAGE_BASE64_LENGTH = 6 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])
const DetectedNameSchema = z.object({ denominacion: z.string().nullable(), confidence: z.number().min(0).max(1) })

export async function POST(request: NextRequest) {
  const quota = await reservePublicDemoQuota(getPublicDemoIdentity(request.headers))
  if (!quota.ok) {
    console.error("[public-trademark-preview] quota service unavailable")
    return NextResponse.json(
      { error: "La demostración no está disponible en este momento." },
      { status: 503, headers: previewHeaders() },
    )
  }

  const rateHeaders = getPublicDemoRateHeaders(quota)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Alcanzaste el límite de demostraciones por hora. Solicita acceso para continuar investigando." },
      { status: 429, headers: previewHeaders(rateHeaders) },
    )
  }

  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "La demostración no está disponible en este momento." }, { status: 503, headers: previewHeaders(rateHeaders) })
    const body = await request.json()
    const rawName = typeof body.nombre === "string" ? body.nombre.trim() : ""
    const actividad = typeof body.actividad === "string" ? body.actividad.trim() : ""
    const image = typeof body.image === "string" ? body.image.trim() : ""
    if (rawName.length > MAX_NAME_LENGTH) return NextResponse.json({ error: `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.` }, { status: 400, headers: previewHeaders(rateHeaders) })
    if (actividad.length > MAX_ACTIVITY_LENGTH) return NextResponse.json({ error: `La actividad no puede superar ${MAX_ACTIVITY_LENGTH} caracteres.` }, { status: 400, headers: previewHeaders(rateHeaders) })
    if (!rawName && !image) return NextResponse.json({ error: "Sube una imagen o escribe el nombre de la marca." }, { status: 400, headers: previewHeaders(rateHeaders) })

    let cleanImage: string | undefined
    let imageMimeType: string | undefined
    if (image) {
      const mimeMatch = image.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)
      const parsedMimeType = (mimeMatch?.[1] ?? "").toLowerCase()
      if (!ALLOWED_IMAGE_TYPES.has(parsedMimeType)) return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 415, headers: previewHeaders(rateHeaders) })
      const parsedImage = image.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "")
      if (!/^[a-z0-9+/=\r\n]+$/i.test(parsedImage) || parsedImage.length > MAX_IMAGE_BASE64_LENGTH) return NextResponse.json({ error: "La imagen no es válida o supera el máximo aproximado de 4,5 MB." }, { status: 400, headers: previewHeaders(rateHeaders) })
      imageMimeType = parsedMimeType
      cleanImage = parsedImage
    }

    let nombre = rawName
    let denominationConfidence: number | null = null
    if (!nombre && cleanImage && imageMimeType) {
      const detected = await detectTrademarkName(cleanImage, imageMimeType)
      nombre = detected.denominacion?.trim().slice(0, MAX_NAME_LENGTH) ?? ""
      denominationConfidence = detected.confidence
    }
    if (!nombre) return NextResponse.json({ error: "No pudimos leer una denominación clara en la imagen. Escribe el nombre para completar la búsqueda.", needs_name: true }, { status: 400, headers: previewHeaders(rateHeaders) })

    const report = await new TrademarkAgent().analyze({
      imageBase64: cleanImage,
      imageMimeType,
      nombreMarca: nombre,
      descripcion: actividad || undefined,
      includeExecutiveReport: false,
    })
    const registry = report.registrabilidad
    const antecedentes = (registry?.antecedentes ?? []).slice(0, 4).map((item) => ({
      id: item.id,
      nombre: item.nombre,
      titular: item.solicitante,
      estado: item.estado,
      clases: item.clases,
      numero_registro: item.numero_registro,
      numero_solicitud: item.numero_solicitud,
      razones: item.razones.slice(0, 5),
      similitud_denominativa: item.similitud_denominativa,
      similitud_fonetica: item.similitud_fonetica,
      similitud_visual: item.similitud_visual,
      similitud_figurativa: item.similitud_figurativa,
      viena_compartida: item.viena_compartida,
      elementos_visuales_compartidos: item.elementos_visuales_compartidos,
      imagen_url: item.imagen_url,
    }))

    const resultadosUnicos = registry?.calidad.resultados_totales ?? 0
    const resultadosActivos = registry?.calidad.resultados_activos ?? 0
    const advertencias = registry?.calidad.advertencias ?? []
    const hasVisualEvidence = report.viena.codes.length > 0 || report.viena.elementos_detectados.length > 0
    const publicReading = buildPublicReading({
      nombre,
      resultadosUnicos,
      resultadosActivos,
      antecedentesMostrados: antecedentes.length,
      hasVisualEvidence,
      warningCount: advertencias.length,
    })

    return NextResponse.json({
      marca: nombre,
      denomination_source: rawName ? "user" : "image-detected",
      denomination_confidence: denominationConfidence,
      niza_context_provided: Boolean(actividad),
      visual: {
        elementos: report.viena.elementos_detectados.slice(0, 6),
        colores: report.viena.colores_dominantes.slice(0, 5),
        viena: report.viena.codes.slice(0, 6).map((code) => ({ code: code.code, titulo: code.titulo, elemento: code.elemento, confidence: code.confidence })),
        fingerprint: report.visual_fingerprint,
      },
      niza: report.niza.clases.slice(0, 5).map((item) => ({ numero: item.numero, titulo: item.titulo, tipo: item.tipo, razon: item.razon })),
      busqueda: {
        estrategias_planificadas: registry?.calidad.estrategias.length ?? 0,
        estrategias_ejecutadas: registry?.calidad.estrategias_ejecutadas ?? 0,
        estrategias: registry?.calidad.estrategias ?? [],
        resultados_brutos: registry?.calidad.resultados_brutos ?? 0,
        resultados_unicos: resultadosUnicos,
        duplicados_eliminados: registry?.calidad.duplicados_eliminados ?? 0,
        estrategias_fallidas: advertencias.filter((item) => item.includes("estrategia(s)")).length,
      },
      evidencia: {
        fuente: "N3uralia Intelligence + INAPI live",
        fuente_oficial: "INAPI",
        metodo: "índice sincronizado + verificación live",
        consultado_en: registry?.fuente.consultado_en ?? report.timestamp,
        resultados_totales: resultadosUnicos,
        resultados_activos: resultadosActivos,
        confianza: registry?.calidad.confianza ?? "baja",
        imagenes_comparadas: registry?.calidad.imagenes_comparadas ?? 0,
        antecedentes_con_viena: registry?.calidad.antecedentes_con_viena ?? 0,
        advertencias,
      },
      lectura: publicReading,
      antecedentes,
      preview: true,
      locked_count: Math.max(0, resultadosUnicos - antecedentes.length),
    }, { headers: previewHeaders(rateHeaders) })
  } catch (error) {
    console.error("[public-trademark-preview] failed", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "No fue posible completar la demostración." }, { status: 500, headers: previewHeaders(rateHeaders) })
  }
}

async function detectTrademarkName(imageBase64: string, imageMimeType: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.chat.completions.parse({ model: "gpt-5.6-luna", max_completion_tokens: 160, messages: [{ role: "system", content: "Identifica únicamente la denominación marcaria visible y principal. No inventes texto. Si no hay texto suficientemente claro, devuelve null. Ignora slogans secundarios, etiquetas legales, precios y texto ambiental." }, { role: "user", content: [{ type: "text", text: "Lee la denominación principal de esta marca o logo." }, { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${imageBase64}`, detail: "low" } }] }], response_format: zodResponseFormat(DetectedNameSchema, "public_detected_trademark_name") })
  return response.choices[0]?.message.parsed ?? { denominacion: null, confidence: 0 }
}

function buildPublicReading({
  nombre,
  resultadosUnicos,
  resultadosActivos,
  antecedentesMostrados,
  hasVisualEvidence,
  warningCount,
}: {
  nombre: string
  resultadosUnicos: number
  resultadosActivos: number
  antecedentesMostrados: number
  hasVisualEvidence: boolean
  warningCount: number
}) {
  if (resultadosUnicos === 0) {
    return {
      resumen: `La consulta sobre ${nombre} no devolvió registros únicos en esta revisión. Ese resultado no demuestra disponibilidad ni registrabilidad.`,
      recomendacion: "Amplía la investigación con clases Niza, variantes denominativas y revisión visual cuando corresponda, y confirma siempre los antecedentes directamente en la fuente oficial.",
    }
  }

  const activeCopy = resultadosActivos > 0
    ? ` ${resultadosActivos} aparecen con estado activo dentro de la cobertura observada.`
    : " No se identificaron registros activos dentro de la cobertura observada."
  const displayedCopy = antecedentesMostrados > 0
    ? ` La demo muestra ${antecedentesMostrados} antecedente${antecedentesMostrados === 1 ? "" : "s"} para revisión inicial.`
    : ""
  const visualCopy = hasVisualEvidence
    ? " La imagen aportó señales figurativas que se muestran por separado."
    : " No hubo evidencia visual suficiente para añadir señales figurativas comparables."
  const warningCopy = warningCount > 0
    ? " La consulta también reportó limitaciones que deben leerse junto a los resultados."
    : ""

  return {
    resumen: `La consulta sobre ${nombre} devolvió ${resultadosUnicos} registro${resultadosUnicos === 1 ? "" : "s"} único${resultadosUnicos === 1 ? "" : "s"}.${activeCopy}${displayedCopy}${visualCopy}${warningCopy}`,
    recomendacion: "Revisa primero los antecedentes mostrados, confirma estado, titular y clases en INAPI y utiliza las señales denominativas, fonéticas y visuales sólo como apoyo para decidir qué merece revisión profesional.",
  }
}

function previewHeaders(extra: Record<string, string> = {}) {
  return { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", ...extra }
}