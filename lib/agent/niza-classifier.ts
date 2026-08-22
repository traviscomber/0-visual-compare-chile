/**
 * Niza Classifier — NCL 13a ed. (WIPO 2026)
 * Cost-aware routing: Luna first, then Terra/Sol only when confidence is low.
 */

import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { API_PORTAL_NIZA } from '@/lib/api-portal-data'
import {
  buildAttempt,
  confidenceThreshold,
  forcedClassifierModel,
  modelForTier,
  tierForModel,
  totalRoutingCostUsd,
  type ModelAttempt,
  type ModelRoutingSummary,
  type ModelTier,
} from '@/lib/ai/model-router'

export interface NizaClass {
  numero: string
  titulo: string
  tipo: 'principal' | 'defensiva'
  razon: string
  confidence: number
}

export interface NizaClassification {
  clases: NizaClass[]
  riesgo_sin_registro: 'alto' | 'medio' | 'bajo'
  resumen: string
  model_used: string
  tokens_used: number
  estimated_cost_usd: number
  routing: ModelRoutingSummary
}

const NizaOutputSchema = z.object({
  clases: z.array(z.object({
    numero: z.string(),
    titulo: z.string(),
    tipo: z.enum(['principal', 'defensiva']),
    razon: z.string(),
    confidence: z.number(),
  })),
  riesgo_sin_registro: z.enum(['alto', 'medio', 'bajo']),
  resumen: z.string(),
})

const NIZA_CATALOG_DIGEST = API_PORTAL_NIZA.map(n => `Clase ${n.codigo} — ${n.titulo}`).join('\n')

const SYSTEM_PROMPT = `Eres un experto en Clasificación Niza (NCL 13a edición, OMPI 2026) para registro de marcas en Chile ante el INAPI.

Catálogo completo (45 clases):
${NIZA_CATALOG_DIGEST}

Tu tarea: dado el nombre y descripción de una marca, recomendar las clases Niza correctas para su protección.

Reglas:
- Clases PRINCIPALES: las 1-3 clases donde opera el negocio central
- Clases DEFENSIVAS: las 1-2 clases adicionales recomendadas para protección amplia
- Usa SOLO números de clase presentes en el catálogo anterior
- Razonamiento claro y específico para Chile (mencionar INAPI cuando sea relevante)
- Riesgo sin registro: alto = industria muy competida, medio = moderada, bajo = nicho`

export class NizaClassifier {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async classify(params: {
    nombre: string
    descripcion?: string
    industria?: string
  }): Promise<NizaClassification> {
    const forcedModel = forcedClassifierModel('niza')
    if (forcedModel) {
      return this.classifyForced(params, forcedModel)
    }

    const attempts: ModelAttempt[] = []
    let lastError: unknown
    const tiers: ModelTier[] = ['luna', 'terra', 'sol']

    for (const tier of tiers) {
      const model = modelForTier(tier)
      try {
        const result = await this.classifyWithModel(params, model)
        const confidence = averageConfidence(result.clases)
        const threshold = confidenceThreshold(tier)
        const accepted = tier === 'sol' || (result.clases.length > 0 && confidence >= threshold)
        attempts.push(buildAttempt({
          tier,
          model,
          confidence,
          usage: result.usage,
          reason: accepted ? 'confidence-gate-passed' : 'confidence-below-threshold',
        }))

        if (accepted) {
          return this.finalize(result, attempts, tier, model)
        }
      } catch (error) {
        lastError = error
        attempts.push(buildAttempt({
          tier,
          model,
          confidence: 0,
          reason: error instanceof Error ? `model-error:${error.message}` : 'model-error',
        }))
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Niza classifier exhausted all model tiers')
  }

  private async classifyForced(params: { nombre: string; descripcion?: string; industria?: string }, model: string) {
    const result = await this.classifyWithModel(params, model)
    const tier = tierForModel(model)
    const attempts = [buildAttempt({
      tier,
      model,
      confidence: averageConfidence(result.clases),
      usage: result.usage,
      reason: 'forced-model-override',
    })]
    return this.finalize(result, attempts, tier, model)
  }

  private async classifyWithModel(params: { nombre: string; descripcion?: string; industria?: string }, model: string) {
    const { nombre, descripcion = '', industria = '' } = params
    const userPrompt = `Marca a analizar:
- Nombre: "${nombre}"
- Descripción: "${descripcion || 'No especificada'}"
- Industria: "${industria || 'No especificada'}"

Recomienda las clases principales y, sólo cuando tenga sentido, clases defensivas. Devuelve una razón breve y un confidence entre 0 y 1 para cada clase.`

    const response = await this.client.chat.completions.parse({
      model,
      max_completion_tokens: 700,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(NizaOutputSchema, 'niza_classification'),
    })

    const parsed = response.choices[0]?.message.parsed
    if (!parsed) throw new Error('Niza classifier returned no schema-valid output')

    const clases: NizaClass[] = parsed.clases.flatMap(c => {
      const catalog = API_PORTAL_NIZA.find(n => n.codigo === c.numero)
      if (!catalog) return []
      return [{
        numero: c.numero,
        titulo: catalog.titulo,
        tipo: c.tipo,
        razon: c.razon,
        confidence: Math.max(0, Math.min(1, c.confidence)),
      }]
    })

    return {
      clases,
      riesgo_sin_registro: parsed.riesgo_sin_registro,
      resumen: parsed.resumen,
      usage: response.usage,
    }
  }

  private finalize(
    result: Awaited<ReturnType<NizaClassifier['classifyWithModel']>>,
    attempts: ModelAttempt[],
    tier: ModelTier,
    model: string,
  ): NizaClassification {
    return {
      clases: result.clases,
      riesgo_sin_registro: result.riesgo_sin_registro,
      resumen: result.resumen,
      model_used: model,
      tokens_used: attempts.reduce((sum, attempt) => sum + attempt.total_tokens, 0),
      estimated_cost_usd: totalRoutingCostUsd(attempts),
      routing: {
        final_tier: tier,
        final_model: model,
        escalated: attempts.length > 1,
        attempts,
      },
    }
  }
}

function averageConfidence(clases: NizaClass[]) {
  if (clases.length === 0) return 0
  return clases.reduce((sum, clase) => sum + clase.confidence, 0) / clases.length
}
