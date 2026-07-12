/**
 * Niza Classifier — NCL 13a ed. (WIPO 2026)
 * Usa GPT-4o para proponer clases Niza dado nombre, descripción e imagen.
 */

import OpenAI from 'openai'
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

const NIZA_CATALOG_DIGEST = API_PORTAL_NIZA.map(n => `Clase ${n.codigo} — ${n.titulo}`).join('\n')

const SYSTEM_PROMPT = `Eres un experto en Clasificación Niza (NCL 13a edición, OMPI 2026) para registro de marcas en Chile ante el INAPI.

Catálogo completo (45 clases):
${NIZA_CATALOG_DIGEST}

Tu tarea: dado el nombre y descripción de una marca, recomendar las clases Niza correctas para su protección.

Reglas:
- Clases PRINCIPALES: las 1-3 clases donde opera el negocio central
- Clases DEFENSIVAS: las 1-2 clases adicionales recomendadas para protección amplia
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

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "clases": [
    { "numero": "42", "titulo": "Servicios científicos y tecnológicos", "tipo": "principal", "razon": "La plataforma provee software SaaS de comparación visual", "confidence": 0.95 },
    { "numero": "45", "titulo": "Servicios jurídicos y de seguridad", "tipo": "defensiva", "razon": "Protege el uso en contexto legal de propiedad intelectual", "confidence": 0.75 }
  ],
  "riesgo_sin_registro": "alto",
  "resumen": "Una frase que explica la estrategia de registro recomendada"
}`

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 700,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const tokens = response.usage?.total_tokens ?? 0

    let parsed: { clases?: Array<{ numero: string; titulo: string; tipo: string; razon: string; confidence: number }>; riesgo_sin_registro?: string; resumen?: string }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      parsed = {}
    }

    // Enriquecer con títulos del catálogo real
    const clases: NizaClass[] = (parsed.clases ?? []).map(c => {
      const catalog = API_PORTAL_NIZA.find(n => n.codigo === c.numero)
      return {
        numero: c.numero,
        titulo: catalog?.titulo ?? c.titulo,
        tipo: (c.tipo === 'defensiva' ? 'defensiva' : 'principal') as 'principal' | 'defensiva',
        razon: c.razon,
        confidence: Math.max(0, Math.min(1, c.confidence ?? 0.7)),
      }
    })

    return {
      clases,
      riesgo_sin_registro: (parsed.riesgo_sin_registro as 'alto' | 'medio' | 'bajo') ?? 'medio',
      resumen: parsed.resumen ?? '',
      model_used: 'gpt-4o',
      tokens_used: tokens,
    }
  }
}
