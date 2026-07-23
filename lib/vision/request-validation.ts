const MAX_DECODED_BYTES = 4.5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

export type ValidatedImage = {
  value: string
  mimeType: string | null
  estimatedBytes: number
}

export function validateVisionImage(value: unknown): ValidatedImage | null {
  if (typeof value !== "string" || !value.trim()) return null

  const input = value.trim()
  const dataUrlMatch = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/)
  const mimeType = dataUrlMatch?.[1]?.toLowerCase() ?? null
  const base64 = (dataUrlMatch?.[2] ?? input).replace(/\s/g, "")

  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) return null
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) return null

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  const estimatedBytes = (base64.length * 3) / 4 - padding
  if (!Number.isFinite(estimatedBytes) || estimatedBytes <= 0 || estimatedBytes > MAX_DECODED_BYTES) return null

  return { value: input, mimeType, estimatedBytes }
}

export function normalizeBrandName(value: unknown) {
  if (typeof value !== "string") return undefined
  const normalized = value.trim().replace(/\s+/g, " ")
  return normalized ? normalized.slice(0, 120) : undefined
}
