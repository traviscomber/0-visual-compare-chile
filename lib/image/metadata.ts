import { safeSharp } from "@/lib/image/safety"

export interface ImageMetadata {
  width: number | null
  height: number | null
  format: string | null
  size_bytes: number
  aspect_ratio: number | null
  avg_color: { r: number; g: number; b: number } | null
  brightness: number | null
}

/**
 * Extracts dimensions, format, aspect ratio, average RGB and brightness for an
 * image. Width/height correspond to the rendered dimensions after EXIF
 * orientation is applied (so a portrait JPEG that stores its bytes in landscape
 * with `Orientation=6` still reports the correct portrait dimensions).
 */
export async function extractMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const pipeline = safeSharp(buffer)
  const meta = await pipeline.metadata()
  const width = meta.width ?? null
  const height = meta.height ?? null

  let avgColor: { r: number; g: number; b: number } | null = null
  let brightness: number | null = null

  try {
    const stats = await safeSharp(buffer).stats()
    if (stats.channels && stats.channels.length >= 3) {
      const [r, g, b] = stats.channels
      avgColor = {
        r: Math.round(r.mean),
        g: Math.round(g.mean),
        b: Math.round(b.mean),
      }
      brightness = Math.round(r.mean * 0.299 + g.mean * 0.587 + b.mean * 0.114)
    }
  } catch {
    // ignore stats errors
  }

  return {
    width,
    height,
    format: meta.format ?? null,
    size_bytes: buffer.byteLength,
    aspect_ratio: width && height ? width / height : null,
    avg_color: avgColor,
    brightness,
  }
}

export interface MetadataLike {
  width?: number | null
  height?: number | null
  format?: string | null
  mime_type?: string | null
  size_bytes?: number | null
  avg_color?: { r: number; g: number; b: number } | null
}

/**
 * Compare aspect ratios — returns 0–100.
 */
export function aspectRatioSimilarity(a: MetadataLike, b: MetadataLike): number {
  if (!a.width || !a.height || !b.width || !b.height) return 0
  const arA = a.width / a.height
  const arB = b.width / b.height
  return (Math.min(arA, arB) / Math.max(arA, arB)) * 100
}

/**
 * Compare average RGB colors — euclidean distance normalized to 0-100 similarity.
 */
export function colorSimilarity(a: MetadataLike, b: MetadataLike): number {
  if (!a.avg_color || !b.avg_color) return 0
  const dr = a.avg_color.r - b.avg_color.r
  const dg = a.avg_color.g - b.avg_color.g
  const db = a.avg_color.b - b.avg_color.b
  const distance = Math.sqrt(dr * dr + dg * dg + db * db)
  // Maximum euclidean distance in RGB space ~ sqrt(3 * 255^2) ≈ 441.67
  const similarity = (1 - distance / 441.67) * 100
  return Math.max(0, Math.min(100, similarity))
}

/**
 * Compose a generic 0-100 metadata similarity using dimensions, format, and size.
 */
export function calculateMetadataSimilarity(a: MetadataLike, b: MetadataLike): number {
  let score = 0
  let weights = 0

  if (a.width && a.height && b.width && b.height) {
    const widthRatio = Math.min(a.width, b.width) / Math.max(a.width, b.width)
    const heightRatio = Math.min(a.height, b.height) / Math.max(a.height, b.height)
    const dimsScore = ((widthRatio + heightRatio) / 2) * 100
    score += dimsScore * 0.5
    weights += 0.5
  }

  const formatA = (a.format ?? a.mime_type ?? "").toLowerCase()
  const formatB = (b.format ?? b.mime_type ?? "").toLowerCase()
  if (formatA || formatB) {
    const sameFormat = formatA && formatB && formatA === formatB
    score += (sameFormat ? 100 : 50) * 0.25
    weights += 0.25
  }

  if (a.size_bytes && b.size_bytes) {
    const ratio = Math.min(a.size_bytes, b.size_bytes) / Math.max(a.size_bytes, b.size_bytes)
    score += ratio * 100 * 0.25
    weights += 0.25
  }

  if (weights === 0) return 0
  return Math.max(0, Math.min(100, score / weights))
}
