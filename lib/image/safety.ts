import sharp, { type Sharp } from "sharp"

/**
 * Hard cap on the longest side we ever process. Photos coming from a modern
 * phone can easily be 24MP+ which would OOM a serverless invocation when
 * running multiple sharp pipelines in parallel.
 */
export const MAX_PROCESSING_DIMENSION = 2400

/**
 * Returns a sharp pipeline that:
 *  - is tolerant of partially-corrupt JPEGs (failOn: "none")
 *  - applies EXIF orientation so portrait photos compare correctly
 *  - is downscaled to MAX_PROCESSING_DIMENSION on its longest side
 *
 * Always use this instead of `sharp(buffer)` directly when running pHash,
 * pixel-diff, ELA, or any other heavy analysis. The original buffer is left
 * untouched so EXIF and forensic signals can still be read from it.
 */
export function safeSharp(buffer: Buffer): Sharp {
  return sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_PROCESSING_DIMENSION,
      height: MAX_PROCESSING_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
}

/**
 * Same as safeSharp but reads the bytes back as a normalized JPEG buffer at
 * the given quality. Useful for ELA and any analysis that needs to compare
 * against a re-encoded version of the original.
 */
export async function reencodeAsJpeg(buffer: Buffer, quality: number): Promise<Buffer> {
  return safeSharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer()
}
