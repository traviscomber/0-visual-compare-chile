import sharp from "sharp"
import { safeSharp } from "@/lib/image/safety"

export interface ElaResult {
  /**
   * Tampering score, 0-100. 0 = no anomalies, 100 = strong evidence of local
   * editing. Computed as the mean amplified per-pixel difference between the
   * original and a re-encoded JPEG copy, scaled into a similarity range.
   */
  tampering_score: number
  /** PNG visualization of the ELA map (brighter = higher error). */
  png: Buffer
  width: number
  height: number
}

/**
 * Error Level Analysis (ELA).
 *
 * Re-encodes the input as JPEG at the given quality and diffs it against the
 * decoded original. Areas of the image that have been edited will have a
 * different compression history than untouched areas and therefore show
 * brighter spots in the resulting map. The score is a single number that can
 * be used as a forensic signal alongside the visual.
 */
export async function computeEla(buffer: Buffer, quality = 90): Promise<ElaResult> {
  // Decode the original through the safe pipeline (auto-rotate + downscale).
  const original = await safeSharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = original.info
  if (!width || !height) {
    return { tampering_score: 0, png: Buffer.alloc(0), width: 0, height: 0 }
  }

  // Re-encode the SAME pixels as JPEG and decode back.
  const jpegBytes = await sharp(original.data, { raw: { width, height, channels } })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer()

  const recoded = await sharp(jpegBytes)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const a = original.data
  const b = recoded.data
  const len = Math.min(a.length, b.length)

  // Per-pixel amplified absolute difference.
  const AMPLIFY = 15
  const map = Buffer.alloc(len)
  let total = 0
  for (let i = 0; i < len; i += 1) {
    const d = Math.abs(a[i] - b[i]) * AMPLIFY
    const v = d > 255 ? 255 : d
    map[i] = v
    total += v
  }

  // Mean amplified delta in 0..255 -> remap into a 0..100 tampering score.
  const meanDelta = total / len // 0..255
  // Empirically, untouched JPEGs land below ~12; heavy edits push above ~40.
  const tamperingScore = Math.max(0, Math.min(100, ((meanDelta - 4) / 36) * 100))

  // Build a viewable PNG from the amplified diff.
  const png = await sharp(map, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toBuffer()

  return { tampering_score: Math.round(tamperingScore * 100) / 100, png, width, height }
}
