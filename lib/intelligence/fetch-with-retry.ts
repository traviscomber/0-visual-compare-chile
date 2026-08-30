import "server-only"

const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])

type RetryOptions = {
  attempts?: number
  baseDelayMs?: number
  timeoutMs?: number
}

export async function fetchWithRetry(
  input: string | URL,
  init: RequestInit = {},
  options: RetryOptions = {},
): Promise<Response> {
  const attempts = Math.max(1, Math.min(5, Math.trunc(options.attempts ?? 3)))
  const baseDelayMs = Math.max(50, Math.trunc(options.baseDelayMs ?? 400))
  const timeoutMs = Math.max(1_000, Math.trunc(options.timeoutMs ?? 20_000))
  let lastError: unknown = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (!TRANSIENT_HTTP_STATUSES.has(response.status) || attempt === attempts) return response
      lastError = new Error(`Transient HTTP ${response.status}`)
    } catch (error) {
      lastError = error
      if (attempt === attempts) throw error
    }

    await sleep(baseDelayMs * 2 ** (attempt - 1))
  }

  throw lastError instanceof Error ? lastError : new Error("Source fetch exhausted retry budget")
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
