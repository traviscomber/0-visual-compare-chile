export type ModelTier = 'luna' | 'terra' | 'sol'

export interface TokenUsageLike {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  prompt_tokens_details?: { cached_tokens?: number | null } | null
}

export interface ModelAttempt {
  tier: ModelTier
  model: string
  confidence: number
  prompt_tokens: number
  cached_input_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  reason: string
}

export interface ModelRoutingSummary {
  final_tier: ModelTier
  final_model: string
  escalated: boolean
  attempts: ModelAttempt[]
}

const DEFAULT_MODELS: Record<ModelTier, string> = {
  luna: 'gpt-5.6-luna',
  terra: 'gpt-5.6-terra',
  sol: 'gpt-5.6-sol',
}

// USD per 1M tokens. Keep these centralized and overrideable so pricing changes
// never require touching classifier logic.
const DEFAULT_PRICES: Record<ModelTier, { input: number; cached: number; output: number }> = {
  luna: { input: 0.2, cached: 0.02, output: 1.2 },
  terra: { input: 2, cached: 0.2, output: 12 },
  sol: { input: 5, cached: 0.5, output: 30 },
}

export function modelForTier(tier: ModelTier): string {
  const envKey = `OPENAI_${tier.toUpperCase()}_MODEL`
  return process.env[envKey] || DEFAULT_MODELS[tier]
}

export function forcedClassifierModel(scope: 'niza' | 'viena'): string | undefined {
  const scoped = scope === 'niza' ? process.env.OPENAI_NIZA_MODEL : process.env.OPENAI_VIENA_MODEL
  return scoped || process.env.OPENAI_CLASSIFIER_MODEL || undefined
}

export function tierForModel(model: string): ModelTier {
  if (model.includes('sol')) return 'sol'
  if (model.includes('terra')) return 'terra'
  return 'luna'
}

export function estimateModelCostUsd(tier: ModelTier, usage?: TokenUsageLike | null): number {
  if (!usage) return 0
  const prompt = usage.prompt_tokens ?? 0
  const cached = Math.min(prompt, usage.prompt_tokens_details?.cached_tokens ?? 0)
  const uncached = Math.max(0, prompt - cached)
  const completion = usage.completion_tokens ?? 0
  const price = DEFAULT_PRICES[tier]
  const total = (uncached * price.input + cached * price.cached + completion * price.output) / 1_000_000
  return Number(total.toFixed(6))
}

export function buildAttempt(params: {
  tier: ModelTier
  model: string
  confidence: number
  usage?: TokenUsageLike | null
  reason: string
}): ModelAttempt {
  const usage = params.usage
  const prompt = usage?.prompt_tokens ?? 0
  const cached = Math.min(prompt, usage?.prompt_tokens_details?.cached_tokens ?? 0)
  const completion = usage?.completion_tokens ?? 0
  return {
    tier: params.tier,
    model: params.model,
    confidence: Number(params.confidence.toFixed(4)),
    prompt_tokens: prompt,
    cached_input_tokens: cached,
    completion_tokens: completion,
    total_tokens: usage?.total_tokens ?? prompt + completion,
    estimated_cost_usd: estimateModelCostUsd(params.tier, usage),
    reason: params.reason,
  }
}

export function confidenceThreshold(tier: ModelTier): number {
  if (tier === 'luna') return envNumber('AI_LUNA_CONFIDENCE_THRESHOLD', 0.78)
  if (tier === 'terra') return envNumber('AI_TERRA_CONFIDENCE_THRESHOLD', 0.68)
  return 0
}

export function totalRoutingCostUsd(attempts: ModelAttempt[]): number {
  return Number(attempts.reduce((sum, attempt) => sum + attempt.estimated_cost_usd, 0).toFixed(6))
}

export function maxTier(a: ModelTier, b: ModelTier): ModelTier {
  const rank: Record<ModelTier, number> = { luna: 0, terra: 1, sol: 2 }
  return rank[a] >= rank[b] ? a : b
}

function envNumber(key: string, fallback: number): number {
  const parsed = Number(process.env[key])
  return Number.isFinite(parsed) ? parsed : fallback
}
