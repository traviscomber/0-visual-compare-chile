export interface VisionTokenUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  prompt_tokens_details?: { cached_tokens?: number | null } | null
}

export interface VisionCostMetrics {
  provider: "openai"
  model: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

const DEFAULT_GPT_4O_MINI_PRICES = {
  inputPerMillion: 0.15,
  cachedInputPerMillion: 0.075,
  outputPerMillion: 0.60,
}

export function estimateVisionCost(model: string, usage?: VisionTokenUsage | null): VisionCostMetrics {
  const inputTokens = usage?.prompt_tokens ?? 0
  const cachedInputTokens = Math.min(inputTokens, usage?.prompt_tokens_details?.cached_tokens ?? 0)
  const uncachedInputTokens = Math.max(0, inputTokens - cachedInputTokens)
  const outputTokens = usage?.completion_tokens ?? 0
  const totalTokens = usage?.total_tokens ?? inputTokens + outputTokens

  const prices = model.includes("gpt-4o-mini")
    ? DEFAULT_GPT_4O_MINI_PRICES
    : {
        inputPerMillion: envNumber("VISION_MODEL_INPUT_USD_PER_MILLION", DEFAULT_GPT_4O_MINI_PRICES.inputPerMillion),
        cachedInputPerMillion: envNumber("VISION_MODEL_CACHED_INPUT_USD_PER_MILLION", DEFAULT_GPT_4O_MINI_PRICES.cachedInputPerMillion),
        outputPerMillion: envNumber("VISION_MODEL_OUTPUT_USD_PER_MILLION", DEFAULT_GPT_4O_MINI_PRICES.outputPerMillion),
      }

  const estimatedCostUsd = (
    uncachedInputTokens * prices.inputPerMillion
    + cachedInputTokens * prices.cachedInputPerMillion
    + outputTokens * prices.outputPerMillion
  ) / 1_000_000

  return {
    provider: "openai",
    model,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(8)),
  }
}

function envNumber(key: string, fallback: number) {
  const value = Number(process.env[key])
  return Number.isFinite(value) && value >= 0 ? value : fallback
}
