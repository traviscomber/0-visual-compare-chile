import sharp, { type Sharp } from "sharp"

/**
 * Hard cap on the longest side we ever process. Photos coming from a modern
 * phone can easily be 24MP+ which would OOM a serverless invocation when
 * running multiple sharp pipelines in parallel.
 */
export const MAX_PROCESSING_DIMENSION = 2400

/**
 * Reject images whose decoded pixel count exceeds the upload policy before
 * libvips allocates a potentially unbounded raster. This is the primary guard
 * against decompression bombs.
 */
export const MAX_INPUT_PIXELS = 64_000_000

/**
 * Serverless-safe libvips defaults. A single invocation may create several
 * analysis pipelines, so keep native worker and cache growth bounded.
 */
sharp.concurrency(1)
sharp.cache({ memory: 32, files: 0, items: 20 })

/**
 * Returns a sharp pipeline that:
 *  - rejects malformed/truncated input instead of attempting permissive decode
 *  - rejects decompression bombs above MAX_INPUT_PIXELS
 *  - decodes only the first page/frame of multipage or animated input
 *  - reads sequentially to reduce peak memory pressure
 *  - applies EXIF orientation so portrait photos compare correctly
 *  - is downscaled to MAX_PROCESSING_DIMENSION on its longest side
 *
 * Always use this instead of `sharp(buffer)` directly when running pHash,
 * pixel-diff, ELA, metadata extraction, or any other heavy analysis. The
 * original buffer is left untouched so EXIF and forensic signals can still be
 * read from it.
 */
export function safeSharp(buffer: Buffer): Sharp {
  return sharp(buffer, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
    pages: 1,
    animated: false,
    sequentialRead: true,
    unlimited: false,
  })
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
