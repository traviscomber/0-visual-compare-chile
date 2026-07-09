const DEFAULT_REDIRECT = "/dashboard"

export function safeInternalRedirect(value: string | null | undefined, fallback = DEFAULT_REDIRECT) {
  if (!value) return fallback

  const normalized = value.trim()
  if (!normalized) return fallback
  if (normalized.startsWith("//")) return fallback
  if (!normalized.startsWith("/")) return fallback
  if (normalized.includes("\\")) return fallback

  return normalized
}
