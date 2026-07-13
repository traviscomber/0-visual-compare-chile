/**
 * Trademark Agent — Orquestador central del agente de inteligencia de marcas
 *
 * Pipeline:
 *  1. VienaClassifier  → códigos Viena desde imagen (GPT-4o Vision)
 *  2. NizaClassifier   → clases Niza desde nombre+descripción (GPT-4o)
 *  3. ConflictEngine   → cruza contra repositorio de marcas existentes
 *  4. Informe final    → GPT-4o redacta informe ejecutivo en español chileno
 */

import OpenAI from 'openai'
import { VienaClassifier, type VienaClassification } from './viena-classifier'
import { NizaClassifier, type NizaClassification } from './niza-classifier'
import { ConflictEngine, type ConflictReport } from './conflict-engine'
import { searchInapi } from '@/lib/inapi/client'
import type { Marca } from '@/types/marca'

export interface TrademarkAgentRequest {
  imageBase64: string         // logo a analizar
  imageMimeType?: string      // MIME type de la imagen (default: 'image/png')
  nombreMarca: string
  descripcion?: string
  industria?: string
  visualScore?: number        // score 0-100 del motor SHA/pHash/embeddings si ya se calculó
  repositorio?: Marca[]       // override del repositorio (por defecto: demo data)
}

export interface TrademarkInsightReport {
  // Metadatos
  marca: string
  timestamp: string
  costo_estimado_usd: number
  tokens_totales: number

  // Clasificaciones
  viena: VienaClassification
  niza: NizaClassification

  // Conflictos
  conflictos: ConflictReport

  // INAPI registrabilidad — estado real en Chile
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

  // Informe ejecutivo generado por IA
  informe: {
    resumen_ejecutivo: string
    analisis_conflictos: string
    nivel_riesgo_global: 'ALTO' | 'MEDIO' | 'BAJO'
    recomendaciones: string[]
    proximos_pasos: string[]
    disclaimer: string
  }

  // Debug
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

    // PASO 1 + 2 en paralelo: clasificar Viena (visión) y Niza (texto)
    const [viena, niza] = await Promise.all([
      this.vienaClassifier.classify(req.imageBase64, req.imageMimeType),
      this.nizaClassifier.classify({
        nombre: req.nombreMarca,
        descripcion: req.descripcion,
        industria: req.industria,
      }),
    ])

    tokens_totales += viena.tokens_used + niza.tokens_used

    // PASO 3: Motor de conflictos (síncrono — operar sobre repositorio en memoria)
    const conflictEngine = new ConflictEngine(req.repositorio)
    const conflictos = conflictEngine.analyze({
      vienaCodes: viena.codes,
      nizaClases: niza.clases,
      visualScore: req.visualScore,
      nombreMarca: req.nombreMarca,
    })

    // PASO 3.5: Búsqueda INAPI para verificar disponibilidad real en Chile
    let registrabilidad: TrademarkInsightReport['registrabilidad'] | undefined
    try {
      const inapiResult = await this.searchInapiAvailability(req.nombreMarca, niza.clases)
      registrabilidad = inapiResult
    } catch (err) {
      console.error('[v0] INAPI search error:', err)
      // Continuamos sin INAPI si falla (graceful fallback)
    }

    // PASO 4: Generar informe ejecutivo con GPT-4o
    const informe = await this.generateReport({
      nombreMarca: req.nombreMarca,
      viena,
      niza,
      conflictos,
      visualScore: req.visualScore,
    })
    tokens_totales += informe.tokens_used

    const pipeline_ms = Date.now() - start

    // Estimado de costo: GPT-4o ~$0.005/1K input + $0.015/1K output (aprox $0.01/1K total)
    const costo_estimado_usd = parseFloat(((tokens_totales / 1000) * 0.01).toFixed(4))

    return {
      marca: req.nombreMarca,
      timestamp: new Date().toISOString(),
      costo_estimado_usd,
      tokens_totales,
      viena,
      niza,
      conflictos,
      registrabilidad,
      informe: informe.data,
      pipeline_ms,
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
    const nizaResumen  = niza.clases.map(c => `Clase ${c.numero} [${c.tipo}]: ${c.titulo} — ${c.razon}`).join('\n')
    const conflictosTop = conflictos.conflictos.slice(0, 5).map(c =>
      `• "${c.marca.nombre}" (${c.marca.pais}) — Score ${c.score_total}/100 — ${c.razon_conflicto}`
    ).join('\n')

    const userPrompt = `Genera un informe ejecutivo de análisis de marca para:

MARCA: "${nombreMarca}"
SCORE VISUAL (motor comparación): ${visualScore ?? 'No disponible'}/100
NIVEL RIESGO GLOBAL: ${conflictos.nivel_riesgo_global.toUpperCase()}
CONFLICTOS ENCONTRADOS: ${conflictos.conflictos.length} (Alto: ${conflictos.breakdown.alto}, Medio: ${conflictos.breakdown.medio}, Bajo: ${conflictos.breakdown.bajo})

CLASIFICACIÓN VIENA (elementos visuales detectados):
${vienaResumen || 'No se detectaron códigos Viena'}

CLASIFICACIÓN NIZA (clases de registro recomendadas):
${nizaResumen || 'No se determinaron clases Niza'}

PRINCIPALES CONFLICTOS:
${conflictosTop || 'No se encontraron conflictos relevantes'}

Responde ÚNICAMENTE con JSON válido:
{
  "resumen_ejecutivo": "2-3 oraciones para el cliente. Claro, sin jerga.",
  "analisis_conflictos": "Párrafo explicando los conflictos encontrados y su implicancia en Chile.",
  "nivel_riesgo_global": "ALTO|MEDIO|BAJO",
  "recomendaciones": [
    "Acción concreta 1",
    "Acción concreta 2",
    "Acción concreta 3"
  ],
  "proximos_pasos": [
    "Paso inmediato 1",
    "Paso 2 (corto plazo)"
  ],
  "disclaimer": "Nota legal breve (1 oración): este análisis es orientativo y no reemplaza asesoría jurídica."
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

  /**
   * Búsqueda en INAPI para verificar disponibilidad real de la marca en Chile
   * Retorna estado de registrabilidad y conflictos encontrados
   */
  private async searchInapiAvailability(
    nombreMarca: string,
    nizaClases: NizaClassification['clases']
  ): Promise<TrademarkInsightReport['registrabilidad']> {
    // Extraer palabras clave significativas (>3 chars) para búsquedas adicionales
    const palabrasClave = nombreMarca
      .split(/\s+/)
      .filter(p => p.length > 3)
      .slice(0, 2) // máximo 2 subqueries para no abusar la API

    // Construir lista de queries: nombre completo (match=2) + palabras clave relevantes
    const queries = [
      { query: nombreMarca, matchMode: '2' as const },
      ...palabrasClave
        .filter(p => p.toLowerCase() !== nombreMarca.toLowerCase())
        .map(p => ({ query: p, matchMode: '2' as const })),
    ]

    // Ejecutar todas las búsquedas en paralelo
    const resultados = await Promise.allSettled(
      queries.map(({ query, matchMode }) =>
        searchInapi({ query, type: 'nombre', matchMode })
      )
    )

    // Unir y deduplicar por id/numeroRegistro
    const seen = new Set<string>()
    const todasLasMarcas = resultados.flatMap(r =>
      r.status === 'fulfilled' ? r.value : []
    ).filter(m => {
      const key = m.id || m.nombre
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (todasLasMarcas.length > 0) {
      // Clasificar por nivel de riesgo según estado
      const bloqueantes = todasLasMarcas.filter(m =>
        m.estado === 'Registrada' || m.estado === 'Pendiente'
      )
      const antecedentes = todasLasMarcas.filter(m =>
        m.estado === 'Denegada' || m.estado === 'No Vigente'
      )

      const marca = bloqueantes[0] ?? antecedentes[0]
      const disponible = bloqueantes.length === 0

      let recomendacion: string
      if (!disponible) {
        recomendacion = `⚠ Se encontró la marca "${marca.nombre}" (${marca.estado}) en las clases ${marca.niza?.join(', ') || 'N/A'}. Existe riesgo de oposición. Consulta con un abogado de PI antes de proceder.`
      } else if (antecedentes.length > 0) {
        recomendacion = `⚠ Se encontraron ${antecedentes.length} antecedente(s) no vigente(s) similares (${antecedentes.map(m => `"${m.nombre}" - ${m.estado}`).join('; ')}). La marca podría ser registrable, pero se recomienda revisión profesional.`
      } else {
        recomendacion = '✓ Antecedentes encontrados pero ninguno vigente. Proceder con precaución.'
      }

      return {
        disponible,
        marca_encontrada: {
          nombre: marca.nombre,
          solicitante: marca.solicitante || 'Desconocido',
          clase_niza: marca.niza?.join(', ') || 'N/A',
          estado: marca.estado,
          fecha_registro: marca.metadata?.numSolicitud
            ? `Solicitud ${marca.metadata.numSolicitud}`
            : '',
          pais: 'Chile',
        },
        conflictos_reales: todasLasMarcas.length,
        recomendacion,
      }
    }

    // Búsqueda 2: Por nombre en clase Niza principal
    if (nizaClases.length > 0) {
      const clasePrincipal = nizaClases.find(c => c.tipo === 'principal')?.numero ?? nizaClases[0].numero
      const conflictosClase = await searchInapi({
        query: String(clasePrincipal),
        type: 'clase_niza',
        matchMode: '2',
      })

      if (conflictosClase.length > 0) {
        return {
          disponible: false,
          conflictos_reales: conflictosClase.length,
          recomendacion: `⚠ Se encontraron ${conflictosClase.length} marca(s) en la misma clase Niza ${clasePrincipal}. Riesgo moderado. Consulta con un abogado de PI.`,
        }
      }
    }

    // Sin conflictos encontrados en INAPI
    return {
      disponible: true,
      conflictos_reales: 0,
      recomendacion: 'No se encontraron antecedentes en el registro de INAPI para las búsquedas realizadas. Resultado referencial — INAPI determina la registrabilidad final.',
    }
  }
}
