import sharp from "sharp"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { safeSharp } from "@/lib/image/safety"

/**
 * Normalize two images to the same dimensions RGBA buffer for pixel-level diffing.
 * Handles the case where images might have different original sizes.
 */
async function toAlignedRGBA(buffer: Buffer, width: number, height: number): Promise<Buffer> {
  // Don't use safeSharp here because its resize logic is for capping, not for alignment
  // Instead, use sharp directly: rotate (for EXIF), resize to target, ensure RGBA
  const { data, info } = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize(width, height, { fit: "fill", withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  
  const actualW = info.width || width
  const actualH = info.height || height
  const expectedBytes = actualW * actualH * 4
  
  if (data.length !== expectedBytes) {
    throw new Error(
      `RGBA size mismatch: expected ${actualW}x${actualH}x4=${expectedBytes} bytes, got ${data.length} bytes (channels=${info.channels})`
    )
  }
  
  return Buffer.from(data)
}

export interface DiffOverlayResult {
  /** Composited PNG: red highlights drawn on top of a desaturated image A. */
  png: Buffer
  width: number
  height: number
  diffPixels: number
  totalPixels: number
  /** Pixel-level similarity, 0-100 (1 - diffRatio). */
  pixelSimilarity: number
}

/**
 * Generate a human-readable diff overlay between two images.
 *
 * 1. Both images are rotated by EXIF, downscaled, and resized to a fixed
 *    canvas (default 768 wide preserving the average aspect ratio) so they
 *    are pixel-aligned before pixelmatch runs.
 * 2. pixelmatch produces a transparent RGBA mask where only the differing
 *    pixels are filled in red (`diffMask: true`).
 * 3. We then composite that mask on top of a desaturated, slightly dimmed
 *    copy of image A — so the user sees the actual scene with the
 *    differences highlighted in red, not red dots on a black background.
 */
export async function generateDiffOverlay(
  bufferA: Buffer,
  bufferB: Buffer,
  options: { maxWidth?: number } = {},
): Promise<DiffOverlayResult> {
  const maxWidth = options.maxWidth ?? 768

  const [metaA, metaB] = await Promise.all([
    safeSharp(bufferA).metadata(),
    safeSharp(bufferB).metadata(),
  ])

  const arA = metaA.width && metaA.height ? metaA.width / metaA.height : 4 / 3
  const arB = metaB.width && metaB.height ? metaB.width / metaB.height : 4 / 3
  const aspectRatio = (arA + arB) / 2

  const width = maxWidth
  const height = Math.max(64, Math.round(width / aspectRatio))

  const [rawA, rawB] = await Promise.all([
    toAlignedRGBA(bufferA, width, height),
    toAlignedRGBA(bufferB, width, height),
  ])

  // 1) Build the diff mask: transparent everywhere except where pixels differ.
  const mask = new PNG({ width, height })
  const diffPixels = pixelmatch(rawA, rawB, mask.data, width, height, {
    threshold: 0.12,
    includeAA: true,
    diffMask: true,
    diffColor: [220, 38, 38],
  })
  const maskPng = PNG.sync.write(mask)

  // 2) Build a desaturated, slightly dimmed grayscale version of image A
  //    that the diff mask will be drawn on top of.
  const baseRgb = await sharp(bufferA, { failOn: "none" })
    .rotate()
    .resize(width, height, { fit: "fill", withoutEnlargement: false })
    .grayscale()
    .modulate({ brightness: 0.85 })
    .png()
    .toBuffer()

  // 3) Composite mask over the gray base.
  const composited = await sharp(baseRgb)
    .composite([{ input: maskPng, top: 0, left: 0 }])
    .png({ compressionLevel: 9 })
    .toBuffer()

  const totalPixels = width * height
  const pixelSimilarity = ((totalPixels - diffPixels) / totalPixels) * 100

  return {
    png: composited,
    width,
    height,
    diffPixels,
    totalPixels,
    pixelSimilarity: Math.max(0, Math.min(100, pixelSimilarity)),
  }
}
