/**
 * Viena Classifier — VCL 10a ed. (WIPO 2026)
 * Uses schema-validated vision output to assign Viena codes.
 */

import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { API_PORTAL_VIENA } from '@/lib/api-portal-data'

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
}

const VIENA_MODEL = process.env.OPENAI_VIENA_MODEL || process.env.OPENAI_CLASSIFIER_MODEL || 'gpt-4o'

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

const SYSTEM_PROMPT = `Eres un experto en Clasificación Viena (VCL 10a edición, OMPI 2026) para marcas figurativas registradas en Chile (INAPI).

Tu tarea es analizar imágenes de logos y asignar los códigos Viena más precisos.

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
        codes: [],
        elementos_detectados: [],
        colores_dominantes: [],
        estilo_general: 'No aplica: análisis denominativo sin logo',
        raw_response: '',
        model_used: 'not-used',
        tokens_used: 0,
      }
    }

    const response = await this.client.chat.completions.parse({
      model: VIENA_MODEL,
      max_tokens: 600,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType ?? 'image/png'};base64,${imageBase64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Analiza el logo, identifica sus elementos visuales y asigna únicamente códigos Viena presentes en el catálogo proporcionado. Devuelve confidence entre 0 y 1.',
            },
          ],
        },
      ],
      response_format: zodResponseFormat(VienaOutputSchema, 'viena_classification'),
    })

    const message = response.choices[0]?.message
    const parsed = message?.parsed
    const tokens = response.usage?.total_tokens ?? 0

    if (!parsed) {
      throw new Error('Viena classifier returned no schema-valid output')
    }

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
      model_used: VIENA_MODEL,
      tokens_used: tokens,
    }
  }
}
