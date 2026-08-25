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

Tu tarea: dado el nombre y descripción de una marca, recomendar únicamente las clases Niza respaldadas por los productos o servicios efectivamente descritos.

Reglas:
- Clases PRINCIPALES: las 1-3 clases que corresponden directamente a los productos o servicios ofrecidos
- Clases DEFENSIVAS: 0-2 clases adicionales sólo cuando la descripción contenga una base concreta para ellas; no agregues clases por cobertura genérica
- Usa SOLO números de clase presentes en el catálogo anterior
- Clasifica la modalidad ofrecida, no el tema sobre el que opera un producto o servicio
- Software grabado, descargable o presentado genéricamente como producto de software corresponde a clase 09; SaaS/PaaS, hosting, diseño o desarrollo de software corresponde a clase 42
- No agregues clase 09 a un SaaS puro salvo que también se describa software descargable o instalable
- Un software que analiza, busca o vigila materias jurídicas o marcas NO es por eso un servicio jurídico de clase 45; clase 45 requiere que se ofrezcan servicios jurídicos, representación, tramitación, arbitraje, mediación, seguridad física u otros servicios propios de esa clase
- No agregues clase 35 por el mero hecho de vender o comercializar los propios productos. Clase 35 requiere servicios de publicidad, marketing, gestión/administración comercial, retail, marketplace o intermediación comercial efectivamente ofrecidos
- Si la modalidad necesaria para distinguir entre clases no está descrita, no inventes hechos; elige la clase respaldada literalmente y explica la limitación
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

Recomienda las clases principales y, sólo cuando exista soporte explícito en la descripción, clases defensivas. No infieras productos o servicios únicamente a partir del nombre de la marca. Devuelve una razón breve y un confidence entre 0 y 1 para cada clase.`

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

    const modelClasses: NizaClass[] = parsed.clases.flatMap(c => {
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

    const clases = applySemanticGuardrails(params, modelClasses)

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

function applySemanticGuardrails(
  params: { nombre: string; descripcion?: string; industria?: string },
  modelClasses: NizaClass[],
): NizaClass[] {
  const context = normalizeForMatch(`${params.descripcion ?? ''} ${params.industria ?? ''}`)
  if (!context) return stableClassOrder(dedupeClasses(modelClasses))

  const hasSoftware = matchesAny(context, [
    /\bsoftware\b/,
    /\baplicacion(?:es)?\b/,
    /\bapp(?:s)?\b/,
    /\bprograma(?:s)? informaticos?\b/,
  ])
  const hasDownloadableSoftware = matchesAny(context, [
    /\bsoftware (?:descargable|instalable|grabado)\b/,
    /\baplicacion(?:es)? (?:descargable|instalable|movil|moviles)\b/,
    /\bapp(?:s)? movil(?:es)?\b/,
    /\bprograma(?:s)? informaticos? (?:descargable|instalable|grabado)s?\b/,
  ])
  const hasSoftwareService = matchesAny(context, [
    /\bsaas\b/,
    /\bsoftware como (?:un )?servicio\b/,
    /\bpaas\b/,
    /\bplataforma como (?:un )?servicio\b/,
    /\bplataforma (?:web|en linea|online|cloud|en la nube)\b/,
    /\bdesarrollo de software\b/,
    /\bdiseno de software\b/,
    /\bprogramacion informatica\b/,
    /\bhosting\b/,
    /\balojamiento (?:de|para) (?:software|servidores|sitios web)\b/,
  ])
  const hasClass35Service = matchesAny(context, [
    /\bservicios? de publicidad\b/,
    /\bagencia de (?:publicidad|marketing)\b/,
    /\bservicios? de marketing\b/,
    /\bgestion comercial (?:para|de) terceros\b/,
    /\badministracion de empresas\b/,
    /\badministracion comercial\b/,
    /\bservicios? de retail\b/,
    /\bventa al por (?:menor|mayor)\b/,
    /\bmarketplace\b/,
    /\bintermediacion comercial\b/,
  ])
  const hasClass45Service = matchesAny(context, [
    /\bservicios? juridicos?\b/,
    /\bservicios? legales?\b/,
    /\basesoria legal\b/,
    /\brepresentacion legal\b/,
    /\babogad(?:o|a|os|as)\b/,
    /\blitig(?:io|ios|acion)\b/,
    /\barbitraje\b/,
    /\bmediacion legal\b/,
    /\bauditoria de cumplimiento (?:legal|normativo)\b/,
    /\bregistro de marcas\b/,
    /\btramitacion de marcas\b/,
    /\bservicios? de seguridad (?:fisica|personal)\b/,
    /\binvestigacion privada\b/,
  ])

  let classes = modelClasses.filter((item) => {
    if (item.numero === '35' && !hasClass35Service) return false
    if (item.numero === '45' && !hasClass45Service) return false
    if (item.numero === '09' && hasSoftwareService && !hasDownloadableSoftware) return false
    if (item.numero === '42' && hasSoftware && !hasSoftwareService && !hasDownloadableSoftware) return false
    return true
  })

  if (hasSoftwareService) {
    classes = ensureClass(classes, '42', 'principal', 'La descripción ofrece software como servicio, plataforma tecnológica, hosting o desarrollo de software, modalidad propia de la clase 42.', 0.97)
  } else if (hasSoftware) {
    classes = ensureClass(classes, '09', 'principal', 'La descripción ofrece software como producto sin indicar una modalidad SaaS/PaaS; con la información disponible corresponde tratarlo como software de clase 09.', 0.97)
  }

  if (hasDownloadableSoftware) {
    classes = ensureClass(classes, '09', 'principal', 'La descripción indica software o aplicaciones descargables/instalables, propios de la clase 09.', 0.98)
  }
  if (hasClass45Service) {
    classes = ensureClass(classes, '45', 'principal', 'La descripción ofrece expresamente servicios jurídicos, de representación o seguridad propios de la clase 45.', 0.97)
  }

  return stableClassOrder(dedupeClasses(classes))
}

function ensureClass(
  classes: NizaClass[],
  numero: string,
  tipo: 'principal' | 'defensiva',
  razon: string,
  confidence: number,
) {
  const existing = classes.find((item) => item.numero === numero)
  if (existing) {
    if (tipo === 'principal' && existing.tipo !== 'principal') existing.tipo = 'principal'
    return classes
  }
  const catalog = API_PORTAL_NIZA.find((item) => item.codigo === numero)
  if (!catalog) return classes
  return [...classes, { numero, titulo: catalog.titulo, tipo, razon, confidence }]
}

function dedupeClasses(classes: NizaClass[]) {
  const byNumber = new Map<string, NizaClass>()
  for (const item of classes) {
    const current = byNumber.get(item.numero)
    if (!current || item.tipo === 'principal' || item.confidence > current.confidence) {
      byNumber.set(item.numero, item)
    }
  }
  return [...byNumber.values()]
}

function stableClassOrder(classes: NizaClass[]) {
  return [...classes].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === 'principal' ? -1 : 1
    return Number(a.numero) - Number(b.numero)
  })
}

function normalizeForMatch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value))
}

function averageConfidence(clases: NizaClass[]) {
  if (clases.length === 0) return 0
  return clases.reduce((sum, clase) => sum + clase.confidence, 0) / clases.length
}
