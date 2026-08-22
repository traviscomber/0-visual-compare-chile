/**
 * Niza Classifier — NCL 13a ed. (WIPO 2026)
 * Uses schema-validated model output to propose Niza classes.
 */

import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { API_PORTAL_NIZA } from '@/lib/api-portal-data'

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
}

const NIZA_MODEL = process.env.OPENAI_NIZA_MODEL || process.env.OPENAI_CLASSIFIER_MODEL || 'gpt-4o'

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
    const { nombre, descripcion = '', industria = '' } = params

    const userPrompt = `Marca a analizar:
- Nombre: "${nombre}"
- Descripción: "${descripcion || 'No especificada'}"
- Industria: "${industria || 'No especificada'}"

Recomienda las clases principales y, sólo cuando tenga sentido, clases defensivas. Devuelve una razón breve y un confidence entre 0 y 1 para cada clase.`

    const response = await this.client.chat.completions.parse({
      model: NIZA_MODEL,
      max_tokens: 700,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(NizaOutputSchema, 'niza_classification'),
    })

    const parsed = response.choices[0]?.message.parsed
    const tokens = response.usage?.total_tokens ?? 0

    if (!parsed) {
      throw new Error('Niza classifier returned no schema-valid output')
    }

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
      model_used: NIZA_MODEL,
      tokens_used: tokens,
    }
  }
}
