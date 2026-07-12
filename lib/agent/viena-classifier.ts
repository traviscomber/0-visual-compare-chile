/**
 * Viena Classifier — VCL 10a ed. (WIPO 2026)
 * Usa GPT-4o Vision para asignar códigos Viena a una imagen de logo.
 */

import OpenAI from 'openai'
import { API_PORTAL_VIENA } from '@/lib/api-portal-data'

export interface VienaCode {
  code: string
  titulo: string
  elemento: string   // qué elemento del logo lo origina
  confidence: number // 0-1
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

const VIENA_CATALOG_DIGEST = API_PORTAL_VIENA.map(v => `${v.codigo} — ${v.titulo}`).join('\n')

const SYSTEM_PROMPT = `Eres un experto en Clasificación Viena (VCL 10a edición, OMPI 2026) para marcas figurativas registradas en Chile (INAPI).

Tu tarea es analizar imágenes de logos y asignar los códigos Viena más precisos.

Catálogo de referencia disponible:
${VIENA_CATALOG_DIGEST}

Reglas:
- Asigna SOLO códigos del catálogo anterior
- Sé preciso: prefiere el código más específico disponible
- Incluye colores dominantes usando los códigos 29.01.XX
- Si hay texto o letras estilizadas, incluye códigos 27.XX
- Confidence: 0.9+ = muy claro, 0.7-0.9 = probable, 0.5-0.7 = posible`

export class VienaClassifier {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async classify(imageBase64: string, mimeType?: string): Promise<VienaClassification> {
    const userPrompt = `Analiza este logo y asigna los códigos Viena correspondientes.

Responde ÚNICAMENTE con JSON válido (sin markdown, sin texto extra):
{
  "elementos_detectados": ["descripción de cada elemento visual"],
  "codes": [
    { "code": "26.03.01", "elemento": "círculo principal azul", "confidence": 0.95 },
    { "code": "27.05.01", "elemento": "letra M estilizada dentro del círculo", "confidence": 0.88 }
  ],
  "colores_dominantes": ["azul", "blanco"],
  "estilo_general": "geométrico moderno"
}`

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType ?? 'image/png'};base64,${imageBase64}`, detail: 'high' } },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const tokens = response.usage?.total_tokens ?? 0

    let parsed: { elementos_detectados?: string[]; codes?: Array<{ code: string; elemento: string; confidence: number }>; colores_dominantes?: string[]; estilo_general?: string }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      parsed = {}
    }

    // Enriquecer con títulos del catálogo y deduplicar por código
    const seen = new Set<string>()
    const codes: VienaCode[] = (parsed.codes ?? []).reduce<VienaCode[]>((acc, c) => {
      if (seen.has(c.code)) return acc
      seen.add(c.code)
      const catalog = API_PORTAL_VIENA.find(v => v.codigo === c.code)
      acc.push({
        code: c.code,
        titulo: catalog?.titulo ?? c.code,
        elemento: c.elemento,
        confidence: Math.max(0, Math.min(1, c.confidence ?? 0.5)),
      })
      return acc
    }, [])

    return {
      codes,
      elementos_detectados: parsed.elementos_detectados ?? [],
      colores_dominantes: parsed.colores_dominantes ?? [],
      estilo_general: parsed.estilo_general ?? 'desconocido',
      raw_response: raw,
      model_used: 'gpt-4o',
      tokens_used: tokens,
    }
  }
}
