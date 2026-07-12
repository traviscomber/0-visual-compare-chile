/**
 * POST /api/v1/agent/analyze
 *
 * Endpoint principal del Agente Marca Intelligence.
 * Corre el pipeline completo: Viena → Niza → Conflictos → Informe IA
 *
 * Body (multipart/form-data o JSON):
 *   image       string  Base64 del logo (sin prefijo data:…)
 *   nombre      string  Nombre de la marca
 *   descripcion string  Descripción del negocio (opcional)
 *   industria   string  Sector o industria (opcional)
 *   visualScore number  Score 0-100 del motor SHA/pHash si ya se calculó (opcional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { TrademarkAgent } from '@/lib/agent/trademark-agent'

export const runtime = 'nodejs'
export const maxDuration = 60 // GPT-4o vision puede tardar hasta 30s

const agent = new TrademarkAgent()

export async function POST(request: NextRequest) {
  try {
    // Verificar OPENAI_API_KEY
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no configurada. Agrega la variable de entorno.' },
        { status: 503 }
      )
    }

    const contentType = request.headers.get('content-type') ?? ''
    let image = ''
    let nombre = ''
    let descripcion = ''
    let industria = ''
    let visualScore: number | undefined

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      image       = (form.get('image')       as string) ?? ''
      nombre      = (form.get('nombre')      as string) ?? ''
      descripcion = (form.get('descripcion') as string) ?? ''
      industria   = (form.get('industria')   as string) ?? ''
      const vs    =  form.get('visualScore')
      if (vs) visualScore = parseFloat(vs as string)
    } else {
      const body = await request.json()
      image       = body.image       ?? ''
      nombre      = body.nombre      ?? ''
      descripcion = body.descripcion ?? ''
      industria   = body.industria   ?? ''
      if (body.visualScore !== undefined) visualScore = Number(body.visualScore)
    }

    // Validaciones
    if (!nombre?.trim()) {
      return NextResponse.json({ error: 'El campo "nombre" es requerido.' }, { status: 400 })
    }
    if (!image?.trim()) {
      return NextResponse.json({ error: 'El campo "image" (base64) es requerido.' }, { status: 400 })
    }

    // Extraer MIME type del data URI si viene incluido
    const mimeMatch = image.match(/^data:(image\/[a-z+]+);base64,/)
    const imageMimeType = mimeMatch ? mimeMatch[1] : 'image/png'
    const cleanImage = image.replace(/^data:image\/[a-z+]+;base64,/, '')

    if (cleanImage.length > 6 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagen demasiado grande. Máximo 4.5 MB.' }, { status: 413 })
    }

    console.log(`[v0] TrademarkAgent.analyze: "${nombre}" — imagen ${Math.round(cleanImage.length / 1024)}KB tipo ${imageMimeType}`)

    const report = await agent.analyze({
      imageBase64: cleanImage,
      imageMimeType,
      nombreMarca: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      industria:   industria.trim()   || undefined,
      visualScore,
    })

    console.log(`[v0] TrademarkAgent done: ${report.pipeline_ms}ms — riesgo ${report.informe.nivel_riesgo_global} — tokens ${report.tokens_totales}`)

    return NextResponse.json(report, { status: 200 })
  } catch (error) {
    console.error('[v0] TrademarkAgent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET para verificar disponibilidad del endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/v1/agent/analyze',
    status: 'available',
    openai_configured: !!process.env.OPENAI_API_KEY,
    pipeline: ['viena-classifier (GPT-4o Vision)', 'niza-classifier (GPT-4o)', 'conflict-engine', 'report-generator (GPT-4o)'],
    estimated_cost_per_call: '$0.03–$0.06 USD',
    max_duration_seconds: 60,
  })
}
