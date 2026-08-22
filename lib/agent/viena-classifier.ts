/**
 * Viena Classifier — VCL 10a ed. (WIPO 2026)
 * Cost-aware routing: Luna first, then Terra/Sol only when confidence is low.
 */

import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { API_PORTAL_VIENA } from '@/lib/api-portal-data'
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

export interface VienaCode {
  code: string
  titulo: string
  elemento: string
  confidence: number
}

export interface VienaClassification {
  codes: VienaCode[]
  elementos_detectados: string[]
  colores_dominantes: string[]
  estilo_general: string
  raw_response: string
  model_used: string
  tokens_used: number
  estimated_cost_usd: number
  routing: ModelRoutingSummary
}

const VienaOutputSchema = z.object({
  elementos_detectados: z.array(z.string()),
  codes: z.array(z.object({
    code: z.string(),
    elemento: z.string(),
    confidence: z.number(),
  })),
  colores_dominantes: z.array(z.string()),
  estilo_general: z.string(),
})

const VIENA_CATALOG_DIGEST = API_PORTAL_VIENA.map(v => `${v.codigo} — ${v.titulo}`).join('\n')

const SYSTEM_PROMPT = `Eres un experto en Clasificación Viena (VCL 10a ed., OMPI 2026) para marcas figurativas registradas en Chile (INAPI).

Catálogo de referencia disponible:
${VIENA_CATALOG_DIGEST}

Reglas:
- Asigna SOLO códigos del catálogo anterior
- Sé preciso: prefiere el código más específico disponible
- Incluye colores dominantes y códigos 29.01.XX sólo cuando correspondan al catálogo
- Si hay texto o letras estilizadas, considera códigos 27.XX presentes en el catálogo
- Confidence: 0.9+ = muy claro, 0.7-0.9 = probable, 0.5-0.7 = posible`

export class VienaClassifier {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async classify(imageBase64?: string, mimeType?: string): Promise<VienaClassification> {
    if (!imageBase64) {
      return {
        codes: [], elementos_detectados: [], colores_dominantes: [],
        estilo_general: 'No aplica: análisis denominativo sin logo', raw_response: '',
        model_used: 'not-used', tokens_used: 0, estimated_cost_usd: 0,
        routing: { final_tier: 'luna', final_model: 'not-used', escalated: false, attempts: [] },
      }
    }

    const forcedModel = forcedClassifierModel('viena')
    if (forcedModel) return this.classifyForced(imageBase64, mimeType, forcedModel)

    const attempts: ModelAttempt[] = []
    let lastError: unknown
    const tiers: ModelTier[] = ['luna', 'terra', 'sol']

    for (const tier of tiers) {
      const model = modelForTier(tier)
      try {
        const result = await this.classifyWithModel(imageBase64, mimeType, model)
        const confidence = averageConfidence(result.codes)
        const threshold = confidenceThreshold(tier)
        const accepted = tier === 'sol' || (result.codes.length > 0 && confidence >= threshold)
        attempts.push(buildAttempt({
          tier, model, confidence, usage: result.usage,
          reason: accepted ? 'confidence-gate-passed' : 'confidence-below-threshold',
        }))
        if (accepted) return this.finalize(result, attempts, tier, model)
      } catch (error) {
        lastError = error
        attempts.push(buildAttempt({
          tier, model, confidence: 0,
          reason: error instanceof Error ? `model-error:${error.message}` : 'model-error',
        }))
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Viena classifier exhausted all model tiers')
  }

  private async classifyForced(imageBase64: string, mimeType: string | undefined, model: string) {
    const result = await this.classifyWithModel(imageBase64, mimeType, model)
    const tier = tierForModel(model)
    const attempts = [buildAttempt({
      tier, model, confidence: averageConfidence(result.codes), usage: result.usage,
      reason: 'forced-model-override',
    })]
    return this.finalize(result, attempts, tier, model)
  }

  private async classifyWithModel(imageBase64: string, mimeType: string | undefined, model: string) {
    const response = await this.client.chat.completions.parse({
      model,
      max_completion_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType ?? 'image/png'};base64,${imageBase64}`, detail: 'high' } },
            { type: 'text', text: 'Analiza el logo, identifica sus elementos visuales y asigna únicamente códigos Viena presentes en el catálogo proporcionado. Devuelve confidence entre 0 y 1.' },
          ],
        },
      ],
      response_format: zodResponseFormat(VienaOutputSchema, 'viena_classification'),
    })

    const message = response.choices[0]?.message
    const parsed = message?.parsed
    if (!parsed) throw new Error('Viena classifier returned no schema-valid output')

    const seen = new Set<string>()
    const codes: VienaCode[] = parsed.codes.reduce<VienaCode[]>((acc, c) => {
      if (seen.has(c.code)) return acc
      const catalog = API_PORTAL_VIENA.find(v => v.codigo === c.code)
      if (!catalog) return acc
      seen.add(c.code)
      acc.push({
        code: c.code,
        titulo: catalog.titulo,
        elemento: c.elemento,
        confidence: Math.max(0, Math.min(1, c.confidence)),
      })
      return acc
    }, [])

    return {
      codes,
      elementos_detectados: parsed.elementos_detectados,
      colores_dominantes: parsed.colores_dominantes,
      estilo_general: parsed.estilo_general,
      raw_response: message?.content ?? '',
      usage: response.usage,
    }
  }

  private finalize(
    result: Awaited<ReturnType<VienaClassifier['classifyWithModel']>>,
    attempts: ModelAttempt[], tier: ModelTier, model: string,
  ): VienaClassification {
    return {
      codes: result.codes,
      elementos_detectados: result.elementos_detectados,
      colores_dominantes: result.colores_dominantes,
      estilo_general: result.estilo_general,
      raw_response: result.raw_response,
      model_used: model,
      tokens_used: attempts.reduce((sum, attempt) => sum + attempt.total_tokens, 0),
      estimated_cost_usd: totalRoutingCostUsd(attempts),
      routing: { final_tier: tier, final_model: model, escalated: attempts.length > 1, attempts },
    }
  }
}

function averageConfidence(codes: VienaCode[]) {
  if (codes.length === 0) return 0
  return codes.reduce((sum, code) => sum + code.confidence, 0) / codes.length
}
