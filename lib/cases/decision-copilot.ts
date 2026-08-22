import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { estimateModelCostUsd, modelForTier } from "@/lib/ai/model-router"

const SuggestedActionSchema = z.object({
  action: z.enum(["remind_reviewers", "extend_deadline", "raise_priority", "open_governance", "investigate", "none"]),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
})

const CopilotOutputSchema = z.object({
  answer: z.string(),
  observations: z.array(z.string()).max(6),
  risks: z.array(z.string()).max(6),
  missing: z.array(z.string()).max(6),
  suggested_actions: z.array(SuggestedActionSchema).max(4),
})

export type CopilotOutput = z.infer<typeof CopilotOutputSchema>

export type CopilotContext = {
  case: Record<string, unknown>
  evidence: Array<Record<string, unknown>>
  recentEvents: Array<Record<string, unknown>>
  governance: Record<string, unknown> | null
  governanceStatus: Record<string, unknown> | null
  reviews: Array<Record<string, unknown>>
}

const SYSTEM_PROMPT = `Eres el Copilot de decisiones de Visual Compare. Tu función es ayudar a interpretar un expediente empresarial sin inventar hechos.

Reglas obligatorias:
- Usa exclusivamente el contexto autorizado incluido en el prompt.
- Separa hechos observados de inferencias.
- Si falta evidencia, dilo explícitamente.
- No des asesoría legal definitiva ni declares que una marca/patente está aprobada o rechazada.
- Nunca ejecutes acciones. Sólo puedes sugerir acciones que el usuario deberá confirmar.
- Prioriza claridad ejecutiva: qué sabemos, qué riesgo existe, qué falta y qué harías después.
- Responde en español.
- suggested_actions sólo puede contener acciones justificadas por el contexto.`

export async function runDecisionCopilot(params: { question: string; context: CopilotContext }) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      output: deterministicFallback(params.question, params.context),
      model: "deterministic-fallback",
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: 0,
    }
  }

  const model = process.env.OPENAI_COPILOT_MODEL || modelForTier("luna")
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.chat.completions.parse({
    model,
    max_completion_tokens: 900,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Pregunta del usuario:\n${params.question}\n\nContexto autorizado del caso:\n${JSON.stringify(params.context)}` },
    ],
    response_format: zodResponseFormat(CopilotOutputSchema, "decision_copilot"),
  })
  const parsed = response.choices[0]?.message.parsed
  if (!parsed) throw new Error("Copilot returned no schema-valid output")
  return {
    output: parsed,
    model,
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
    estimatedCostUsd: estimateModelCostUsd("luna", response.usage),
  }
}

function deterministicFallback(question: string, context: CopilotContext): CopilotOutput {
  const pendingReviews = context.reviews.filter((review) => review.status === "pending").length
  const evidenceCount = context.evidence.length
  const state = String(context.governanceStatus?.state ?? "sin gobernanza")
  const suggested_actions: CopilotOutput["suggested_actions"] = []
  if (pendingReviews > 0) suggested_actions.push({ action: "remind_reviewers", rationale: `${pendingReviews} revisión(es) siguen pendientes.`, confidence: 0.9 })
  if (evidenceCount === 0) suggested_actions.push({ action: "investigate", rationale: "El caso todavía no contiene evidencia vinculada.", confidence: 0.95 })
  return {
    answer: `Lectura determinista para “${question}”: el caso contiene ${evidenceCount} evidencias, ${pendingReviews} revisiones pendientes y su gobernanza está en estado ${state}.`,
    observations: [`${evidenceCount} evidencias vinculadas.`, `${pendingReviews} revisiones pendientes.`, `Estado de gobernanza: ${state}.`],
    risks: pendingReviews > 0 ? ["La decisión depende de revisiones aún no respondidas."] : [],
    missing: evidenceCount === 0 ? ["Falta evidencia vinculada al expediente."] : [],
    suggested_actions,
  }
}
