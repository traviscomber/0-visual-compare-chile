/**
 * Trademark Agent — Orquestador central del agente de inteligencia de marcas
 */

import OpenAI from 'openai'
import { VienaClassifier, type VienaClassification } from './viena-classifier'
import { NizaClassifier, type NizaClassification } from './niza-classifier'
import { ConflictEngine, type ConflictReport } from './conflict-engine'
import { searchInapi } from '@/lib/inapi/client'
import type { Marca } from '@/types/marca'

export interface TrademarkAgentRequest {
  imageBase64: string
  imageMimeType?: string
  nombreMarca: string
  descripcion?: string
  industria?: string
  visualScore?: number
  repositorio?: Marca[]
}

export interface TrademarkInsightReport {
  marca: string
  timestamp: string
  costo_estimado_usd: number
  tokens_totales: number
  viena: VienaClassification
  niza: NizaClassification
  conflictos: ConflictReport
  registrabilidad?: {
    disponible: boolean
    marca_encontrada?: {
      nombre: string
      solicitante: string
      clase_niza: string
      estado: string
      fecha_registro?: string
      pais: string
    }
    conflictos_reales: number
    recomendacion: string
  }
  informe: {
    resumen_ejecutivo: string
    analisis_conflictos: string
    nivel_riesgo_global: 'ALTO' | 'MEDIO' | 'BAJO'
    recomendaciones: string[]
    proximos_pasos: string[]
    disclaimer: string
  }
  pipeline_ms: number
}

const REPORT_SYSTEM_PROMPT = `Eres un analista senior de propiedad intelectual con 15 años de experiencia en el sistema chileno (INAPI) e internacional (OMPI/WIPO).

Redactas informes ejecutivos claros, directos y orientados a la acción para emprendedores y empresas chilenas.

Tono: profesional pero accesible. Evita jerga legal innecesaria. Siempre proporciona un camino a seguir.`

export class TrademarkAgent {
  private vienaClassifier: VienaClassifier
  private nizaClassifier: NizaClassifier
  private openai: OpenAI

  constructor() {
    this.vienaClassifier = new VienaClassifier()
    this.nizaClassifier = new NizaClassifier()
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async analyze(req: TrademarkAgentRequest): Promise<TrademarkInsightReport> {
    const start = Date.now()
    let tokens_totales = 0

    const [viena, niza] = await Promise.all([
      this.vienaClassifier.classify(req.imageBase64, req.imageMimeType),
      this.nizaClassifier.classify({
        nombre: req.nombreMarca,
        descripcion: req.descripcion,
        industria: req.industria,
      }),
    ])

    tokens_totales += viena.tokens_used + niza.tokens_used

    const conflictEngine = new ConflictEngine(req.repositorio)
    const conflictos = conflictEngine.analyze({
      vienaCodes: viena.codes,
      nizaClases: niza.clases,
      visualScore: req.visualScore,
      nombreMarca: req.nombreMarca,
    })

    let registrabilidad: TrademarkInsightReport['registrabilidad'] | undefined
    try {
      registrabilidad = await this.searchInapiAvailability(req.nombreMarca, niza.clases)
    } catch (err) {
      console.error('[v0] INAPI search error:', err)
    }

    const informe = await this.generateReport({
      nombreMarca: req.nombreMarca,
      viena,
      niza,
      conflictos,
      visualScore: req.visualScore,
    })
    tokens_totales += informe.tokens_used

    return {
      marca: req.nombreMarca,
      timestamp: new Date().toISOString(),
      costo_estimado_usd: parseFloat(((tokens_totales / 1000) * 0.01).toFixed(4)),
      tokens_totales,
      viena,
      niza,
      conflictos,
      registrabilidad,
      informe: informe.data,
      pipeline_ms: Date.now() - start,
    }
  }

  private async generateReport(params: {
    nombreMarca: string
    viena: VienaClassification
    niza: NizaClassification
    conflictos: ConflictReport
    visualScore?: number
  }) {
    const { nombreMarca, viena, niza, conflictos, visualScore } = params
    const vienaResumen = viena.codes.slice(0, 5).map(c => `${c.code} (${c.titulo}): ${c.elemento}`).join('\n')
    const nizaResumen = niza.clases.map(c => `Clase ${c.numero} [${c.tipo}]: ${c.titulo} — ${c.razon}`).join('\n')
    const conflictosTop = conflictos.conflictos.slice(0, 5).map(c =>
      `• "${c.marca.nombre}" (${c.marca.pais}) — Score ${c.score_total}/100 — ${c.razon_conflicto}`
    ).join('\n')

    const userPrompt = `Genera un informe ejecutivo de análisis de marca para:

MARCA: "${nombreMarca}"
SCORE VISUAL (motor comparación): ${visualScore ?? 'No disponible'}/100
NIVEL RIESGO GLOBAL: ${conflictos.nivel_riesgo_global.toUpperCase()}
CONFLICTOS ENCONTRADOS: ${conflictos.conflictos.length} (Alto: ${conflictos.breakdown.alto}, Medio: ${conflictos.breakdown.medio}, Bajo: ${conflictos.breakdown.bajo})

CLASIFICACIÓN VIENA:
${vienaResumen || 'No se detectaron códigos Viena'}

CLASIFICACIÓN NIZA:
${nizaResumen || 'No se determinaron clases Niza'}

PRINCIPALES CONFLICTOS:
${conflictosTop || 'No se encontraron conflictos relevantes'}

Responde ÚNICAMENTE con JSON válido:
{
  "resumen_ejecutivo": "2-3 oraciones para el cliente. Claro, sin jerga.",
  "analisis_conflictos": "Párrafo explicando los conflictos encontrados y su implicancia en Chile.",
  "nivel_riesgo_global": "ALTO|MEDIO|BAJO",
  "recomendaciones": ["Acción concreta 1", "Acción concreta 2", "Acción concreta 3"],
  "proximos_pasos": ["Paso inmediato 1", "Paso 2 (corto plazo)"],
  "disclaimer": "Nota legal breve: este análisis es orientativo y no reemplaza asesoría jurídica."
}`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 900,
      temperature: 0.2,
      messages: [
        { role: 'system', content: REPORT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const tokens_used = response.usage?.total_tokens ?? 0

    let data: TrademarkInsightReport['informe']
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      data = {
        resumen_ejecutivo: parsed.resumen_ejecutivo ?? '',
        analisis_conflictos: parsed.analisis_conflictos ?? '',
        nivel_riesgo_global: (parsed.nivel_riesgo_global ?? conflictos.nivel_riesgo_global.toUpperCase()) as 'ALTO' | 'MEDIO' | 'BAJO',
        recomendaciones: parsed.recomendaciones ?? [],
        proximos_pasos: parsed.proximos_pasos ?? [],
        disclaimer: parsed.disclaimer ?? 'Este análisis es orientativo y no reemplaza asesoría jurídica.',
      }
    } catch {
      data = {
        resumen_ejecutivo: 'No se pudo generar el informe automáticamente.',
        analisis_conflictos: '',
        nivel_riesgo_global: conflictos.nivel_riesgo_global.toUpperCase() as 'ALTO' | 'MEDIO' | 'BAJO',
        recomendaciones: [],
        proximos_pasos: [],
        disclaimer: 'Este análisis es orientativo y no reemplaza asesoría jurídica.',
      }
    }

    return { data, tokens_used }
  }

  private async searchInapiAvailability(
    nombreMarca: string,
    nizaClases: NizaClassification['clases'],
  ): Promise<TrademarkInsightReport['registrabilidad']> {
    const marcasEncontradas = await searchInapi({
      query: nombreMarca,
      type: 'nombre',
      matchMode: '2',
    })

    const requestedClasses = new Set(nizaClases.map((clase) => String(clase.numero)))
    const sameClass = marcasEncontradas.filter((marca) =>
      marca.niza.some((code) => requestedClasses.has(String(code))),
    )
    const relevant = sameClass.length > 0 ? sameClass : marcasEncontradas
    const active = relevant.filter((marca) => marca.estado === 'Registrada' || marca.estado === 'Pendiente')
    const top = active[0] ?? relevant[0]

    if (active.length > 0 && top) {
      return {
        disponible: false,
        marca_encontrada: {
          nombre: top.nombre,
          solicitante: top.solicitante || 'Desconocido',
          clase_niza: top.niza?.join(', ') || 'N/A',
          estado: top.estado,
          fecha_registro: top.fecha || '',
          pais: 'Chile',
        },
        conflictos_reales: active.length,
        recomendacion: sameClass.length > 0
          ? `Se encontraron ${active.length} antecedente(s) vigente(s) o pendiente(s) en clases Niza relacionadas. Requiere revisión jurídica antes de presentar.`
          : `Se encontraron ${active.length} antecedente(s) vigente(s) o pendiente(s) por nombre. Requiere revisión jurídica antes de presentar.`,
      }
    }

    if (relevant.length > 0 && top) {
      return {
        disponible: true,
        marca_encontrada: {
          nombre: top.nombre,
          solicitante: top.solicitante || 'Desconocido',
          clase_niza: top.niza?.join(', ') || 'N/A',
          estado: top.estado,
          fecha_registro: top.fecha || '',
          pais: 'Chile',
        },
        conflictos_reales: relevant.length,
        recomendacion: 'Solo se encontraron antecedentes no vigentes o denegados. El resultado es orientativo y debe revisarse antes de presentar.',
      }
    }

    return {
      disponible: true,
      conflictos_reales: 0,
      recomendacion: 'No se encontraron coincidencias en esta consulta. El resultado es orientativo y no garantiza registrabilidad.',
    }
  }
}
