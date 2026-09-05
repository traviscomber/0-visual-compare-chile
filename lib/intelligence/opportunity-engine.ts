import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { estimateModelCostUsd, modelForTier } from "@/lib/ai/model-router"
import type { CompanyWebsiteProfile } from "@/lib/intelligence/company-website-profile"
import { buildTechnologySignals } from "@/lib/intelligence/technology-signals"

const LIVE_RESEARCH_LIMIT = 3
const LIVE_RESEARCH_WINDOW_DAYS = 180

const CapabilitySchema = z.object({
  name: z.string(),
  category: z.enum(["technical", "operational", "data", "distribution", "domain", "workflow"]),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()).max(4),
  leverage: z.string(),
})

const ScoreSchema = z.object({
  strategic_fit: z.number().int().min(0).max(100),
  capability_reuse: z.number().int().min(0).max(100),
  novelty: z.number().int().min(0).max(100),
  timing: z.number().int().min(0).max(100),
  evidence_strength: z.number().int().min(0).max(100),
  defensibility: z.number().int().min(0).max(100),
  overall: z.number().int().min(0).max(100),
})

const OpportunitySchema = z.object({
  name: z.string(),
  one_line: z.string(),
  target_buyer: z.string(),
  problem: z.string(),
  product_shape: z.string(),
  wedge: z.string(),
  unfair_advantage: z.string(),
  why_now: z.string(),
  contrarian_reason: z.string(),
  second_order_effect: z.string(),
  capability_reuse: z.array(z.string()).min(2).max(8),
  observed_signals: z.array(z.string()).max(10),
  assumptions: z.array(z.string()).max(6),
  disconfirming_signals: z.array(z.string()).max(6),
  moat: z.string(),
  first_experiments: z.array(z.string()).min(1).max(4),
  watch_triggers: z.array(z.string()).min(1).max(5),
  research_queries: z.array(z.string()).min(1).max(3),
  missing_evidence: z.array(z.string()).max(6),
  evidence_state: z.enum(["observed", "mixed", "hypothesis"]),
  decision: z.enum(["build", "investigate", "watch", "reject"]),
  confidence: z.number().min(0).max(1),
  scores: ScoreSchema,
})

const DoNotBuildSchema = z.object({
  idea: z.string(),
  reason: z.string(),
})

export const OpportunityEngineOutputSchema = z.object({
  company_summary: z.string(),
  market_posture: z.string(),
  capabilities: z.array(CapabilitySchema).min(3).max(16),
  opportunities: z.array(OpportunitySchema).min(4).max(7),
  do_not_build: z.array(DoNotBuildSchema).max(6),
  frontier_questions: z.array(z.string()).min(3).max(10),
  next_research: z.array(z.string()).min(3).max(10),
})

export type OpportunityEngineOutput = z.infer<typeof OpportunityEngineOutputSchema>

type Opportunity = z.infer<typeof OpportunitySchema>

export type OpportunityEngineContext = {
  organization: {
    id: string
    name: string
    slug: string
    ownIdentity?: { canonicalName: string; country: string | null; metadata: unknown } | null
  }
  website: CompanyWebsiteProfile
  recentSearches: Array<Record<string, unknown>>
  userWatches: Array<Record<string, unknown>>
  observedEvents: Array<Record<string, unknown>>
  recommendations: Array<Record<string, unknown>>
  generatedAt: string
  challenge?: string | null
}

const SYSTEM_PROMPT = `Eres VIDENTIA Opportunity Engine, un sistema de Innovation Intelligence diseñado para descubrir productos que una empresa podría construir antes de que la oportunidad sea obvia para el mercado.

Tu trabajo NO es generar ideas creativas genéricas. Tu trabajo es construir hipótesis estratégicas auditables a partir de capacidades observadas y señales autorizadas.

REGLAS EPISTEMOLÓGICAS OBLIGATORIAS
- Usa exclusivamente el contexto incluido en el prompt. No presentes conocimiento externo no entregado como hecho.
- Distingue con rigor entre evidencia observada, inferencia y vacío de información.
- "why_now" sólo puede citar señales observadas del contexto; si no hay señal temporal suficiente, dilo y baja timing/evidence_strength.
- No inventes TAM, clientes, competidores, ingresos, adopción, regulación, patentes o tendencias.
- Si una oportunidad parece atractiva pero carece de evidencia externa, clasifícala como investigate o watch, no build.
- Cada oportunidad debe reutilizar al menos dos capacidades observadas de la empresa.
- Penaliza ideas que sólo sean "otro chatbot", "otro dashboard" o SaaS horizontal sin ventaja injusta específica.
- Busca adyacencias no obvias donde la combinación de capacidades sea difícil de copiar.
- Prefiere nuevos sistemas, redes de inteligencia, infraestructuras de decisión, productos de datos o loops operacionales con aprendizaje acumulativo sobre features aisladas.
- Desafía cada hipótesis: incluye señales que la invalidarían, evidencia faltante y criterios de investigación.
- No confundas actividad pública con intención empresarial.
- Los eventos de watches son señales observadas, no pruebas de demanda. Úsalos para formular y tensionar hipótesis, no para declarar mercado validado.
- Para cada tesis entrega research_queries: 1 a 3 frases técnicas breves que puedan buscarse directamente en literatura, patentes y noticias. Deben describir la tecnología/capacidad habilitante, no el nombre inventado del producto ni una frase comercial.
- Mantén decisiones humanas: build significa "merece prototipo/validación", no autorización automática de inversión.

MÉTODO
1. Reconstruye el capability graph real desde la web y señales internas.
2. Busca combinaciones de capacidades que creen una ventaja compuesta.
3. Detecta adyacencias: mismo motor → nuevo problema; mismo problema → nuevo sector; misma evidencia → nuevo workflow; nueva tecnología → capacidad existente.
4. Exige un wedge concreto: quién compra primero y qué trabajo urgente resuelve.
5. Busca second-order effects: qué se vuelve posible después de tener el producto y sus datos.
6. Puntúa cada tesis con severidad. No infles scores.
7. Incluye al menos tres oportunidades no obvias y al menos dos ideas que explícitamente NO conviene construir.

PONDERACIÓN DEL OVERALL
- strategic_fit 25%
- capability_reuse 20%
- novelty 15%
- timing 15%
- evidence_strength 15%
- defensibility 10%

El servidor recalculará el overall, investigará automáticamente un número limitado de las mejores tesis contra OpenAlex, Crossref, INAPI y GDELT, y puede degradar una decisión build cuando evidencia/confianza sean insuficientes. La presencia de noticias jamás equivale por sí sola a demanda o validación de mercado. No intentes compensar evidencia débil inflando otros factores.

Responde en español ejecutivo, concreto y técnicamente preciso.`

export async function runOpportunityEngine(context: OpportunityEngineContext) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured")

  const model = process.env.OPENAI_OPPORTUNITY_MODEL || modelForTier("sol")
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.chat.completions.parse({
    model,
    max_completion_tokens: 4_700,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `Organización: ${context.organization.name}`,
          `Momento del análisis: ${context.generatedAt}`,
          context.challenge ? `Desafío adicional del usuario: ${context.challenge}` : null,
          "",
          "CONTEXTO AUTORIZADO DE LA EMPRESA",
          JSON.stringify({
            organization: context.organization,
            website: {
              canonicalUrl: context.website.canonicalUrl,
              pages: context.website.pages.map((page) => ({ url: page.url, title: page.title })),
              text: context.website.combinedText,
            },
            recentSearches: context.recentSearches,
            userWatches: context.userWatches,
            observedWatchEvents: context.observedEvents,
            persistedRecommendations: context.recommendations,
          }),
          "",
          "Entrega primero capacidades demostrables. Después genera tesis de producto únicas y desafiadas. No uses conocimiento externo no presente en el contexto como evidencia.",
        ].filter(Boolean).join("\n"),
      },
    ],
    response_format: zodResponseFormat(OpportunityEngineOutputSchema, "videntia_opportunity_engine"),
  })

  const parsed = response.choices[0]?.message.parsed
  if (!parsed) throw new Error("Opportunity Engine returned no schema-valid output")

  const calibrated = parsed.opportunities.map(calibrateOpportunity)
  const researchTargets = [...calibrated]
    .filter((item) => item.decision !== "reject")
    .sort((a, b) => b.scores.overall - a.scores.overall)
    .slice(0, LIVE_RESEARCH_LIMIT)
  const targetNames = new Set(researchTargets.map((item) => item.name))
  const researched = await Promise.all(researchTargets.map(enrichOpportunityWithLiveResearch))
  const researchedByName = new Map(researched.map((item) => [item.name, item]))

  const output: OpportunityEngineOutput = {
    ...parsed,
    opportunities: calibrated.map((item) => targetNames.has(item.name) ? (researchedByName.get(item.name) ?? item) : item),
  }

  return {
    output,
    model,
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
    estimatedCostUsd: estimateModelCostUsd("sol", response.usage),
  }
}

async function enrichOpportunityWithLiveResearch(item: Opportunity): Promise<Opportunity> {
  const query = item.research_queries[0]?.trim()
  if (!query) return item

  try {
    const signals = await buildTechnologySignals(query, LIVE_RESEARCH_WINDOW_DAYS, "both")
    const coreSourceAvailable = Boolean(signals.sources.openalex.available || signals.sources.crossref.available || signals.sources.inapi_patents.available)
    if (!coreSourceAvailable) return item

    let evidenceDelta = 0
    let timingDelta = 0
    let confidenceDelta = 0

    if (signals.corroboration.status === "corroborada") {
      evidenceDelta += 10
      timingDelta += 6
      confidenceDelta += 0.06
    } else if (signals.corroboration.status === "parcial") {
      evidenceDelta += 5
      timingDelta += 3
      confidenceDelta += 0.03
    }

    if (signals.patent_signal.available && signals.patent_signal.recent_matches > 0) {
      evidenceDelta += Math.min(6, 2 + signals.patent_signal.recent_matches)
      timingDelta += 3
    }

    if (signals.momentum.available && signals.momentum.change_percent !== null) {
      if (signals.momentum.change_percent >= 20) {
        evidenceDelta += 4
        timingDelta += 4
      } else if (signals.momentum.change_percent <= -20) {
        timingDelta -= 3
      }
    }

    const liveFacts = buildLiveResearchFacts(query, signals)
    const next: Opportunity = {
      ...item,
      why_now: liveFacts.length ? `${item.why_now} Investigación automática VIDENTIA: ${liveFacts.join(" ")}` : item.why_now,
      observed_signals: dedupeStrings([...item.observed_signals, ...liveFacts]).slice(0, 10),
      evidence_state: item.evidence_state === "hypothesis" && liveFacts.length ? "mixed" : item.evidence_state,
      confidence: clamp(item.confidence + confidenceDelta, 0, 1),
      scores: {
        ...item.scores,
        evidence_strength: clamp(Math.round(item.scores.evidence_strength + evidenceDelta), 0, 100),
        timing: clamp(Math.round(item.scores.timing + timingDelta), 0, 100),
      },
    }

    return calibrateOpportunity(next)
  } catch (error) {
    console.warn(`[opportunity-engine] live research unavailable for ${query}`, error)
    return item
  }
}

function buildLiveResearchFacts(query: string, signals: Awaited<ReturnType<typeof buildTechnologySignals>>): string[] {
  const facts: string[] = []

  if (signals.momentum.available) {
    const current = signals.momentum.current_publications ?? 0
    const previous = signals.momentum.previous_publications ?? 0
    const change = signals.momentum.change_percent
    facts.push(`Probe “${query}”: ${current} publicaciones en ${signals.period_days} días vs ${previous} en la ventana anterior; tendencia ${signals.momentum.trend}${change === null ? "" : ` (${change > 0 ? "+" : ""}${change}%)`}.`)
  }

  if (signals.patent_signal.available) {
    facts.push(`INAPI para “${query}”: ${signals.patent_signal.recent_matches} coincidencias recientes de alta precisión, ${signals.patent_signal.selected_matches} antecedentes seleccionados y ${signals.patent_signal.distinct_applicants} solicitantes distintos.`)
  }

  facts.push(`Corroboración del probe: ${signals.corroboration.status} (${signals.corroboration.confirming_axes}/${signals.corroboration.available_axes} ejes disponibles confirman actividad).`)
  return facts
}

function calibrateOpportunity(item: Opportunity): Opportunity {
  const overall = Math.round(
    item.scores.strategic_fit * 0.25
    + item.scores.capability_reuse * 0.20
    + item.scores.novelty * 0.15
    + item.scores.timing * 0.15
    + item.scores.evidence_strength * 0.15
    + item.scores.defensibility * 0.10,
  )

  let decision = item.decision
  if (decision === "build" && (item.scores.evidence_strength < 60 || item.confidence < 0.65 || item.evidence_state === "hypothesis")) {
    decision = "investigate"
  }
  if (decision === "investigate" && item.scores.evidence_strength < 30 && item.confidence < 0.45) {
    decision = "watch"
  }

  return {
    ...item,
    decision,
    scores: { ...item.scores, overall },
  }
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase()
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
