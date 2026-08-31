import "server-only"

const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])

type RetryOptions = {
  attempts?: number
  baseDelayMs?: number
  timeoutMs?: number
}

type OperationRetryOptions = Omit<RetryOptions, "timeoutMs"> & {
  shouldRetry?: (error: unknown) => boolean
  onRetry?: (args: { attempt: number; delayMs: number; error: unknown }) => void
}

export async function withSourceRetry<T>(
  operation: () => Promise<T>,
  options: OperationRetryOptions = {},
): Promise<T> {
  const attempts = normalizeAttempts(options.attempts)
  const baseDelayMs = normalizeDelay(options.baseDelayMs)
  const shouldRetry = options.shouldRetry ?? isTransientSourceError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === attempts || !shouldRetry(error)) throw error
      const delayMs = baseDelayMs * 2 ** (attempt - 1)
      options.onRetry?.({ attempt, delayMs, error })
      await sleep(delayMs)
    }
  }

  throw new Error("Source operation exhausted retry budget")
}

export async function fetchWithRetry(
  input: string | URL,
  init: RequestInit = {},
  options: RetryOptions = {},
): Promise<Response> {
  const attempts = normalizeAttempts(options.attempts)
  const baseDelayMs = normalizeDelay(options.baseDelayMs)
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

export function isTransientSourceError(error: unknown) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  if (/\b(408|425|429|500|502|503|504)\b/.test(message)) return true
  return /fetch failed|network|timeout|timed out|aborterror|econnreset|econnrefused|enotfound|socket hang up/i.test(message)
}

function normalizeAttempts(value: number | undefined) {
  return Math.max(1, Math.min(5, Math.trunc(value ?? 3)))
}

function normalizeDelay(value: number | undefined) {
  return Math.max(50, Math.trunc(value ?? 400))
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
