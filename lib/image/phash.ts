import { safeSharp } from "@/lib/image/safety"

/**
 * DCT-based perceptual hash (pHash) — 64-bit hash returned as 16-character hex.
 *
 * Steps:
 *   1. Resize to 32x32 grayscale.
 *   2. Compute 2D DCT-II via separable 1D DCTs.
 *   3. Keep the top-left 8x8 low-frequency block.
 *   4. Drop the DC term (value at [0][0]) when computing the median.
 *   5. For each of the 64 values, output 1 if it is greater than the median, else 0.
 *
 * This is significantly more robust than dHash to JPEG recompression, mild
 * blurring, gamma changes, and slight rotations/scalings — which is exactly
 * the noise we encounter when comparing photos of the same scene shipped
 * through different pipelines.
 */
export async function calculatePerceptualHash(buffer: Buffer): Promise<string> {
  const N = 32
  const M = 8

  const { data } = await safeSharp(buffer)
    .resize(N, N, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Build pixel matrix as floats (0..255).
  const pixels: Float64Array[] = new Array(N)
  for (let y = 0; y < N; y += 1) {
    const row = new Float64Array(N)
    for (let x = 0; x < N; x += 1) {
      row[x] = data[y * N + x]
    }
    pixels[y] = row
  }

  // Precompute cosine basis: cos[(2n+1) * k * PI / (2N)].
  const cos: Float64Array[] = new Array(N)
  for (let k = 0; k < N; k += 1) {
    const row = new Float64Array(N)
    for (let n = 0; n < N; n += 1) {
      row[n] = Math.cos(((2 * n + 1) * k * Math.PI) / (2 * N))
    }
    cos[k] = row
  }

  const c0 = Math.sqrt(1 / N)
  const ck = Math.sqrt(2 / N)

  // 1D DCT along rows -> rowDct[y][u]
  const rowDct: Float64Array[] = new Array(N)
  for (let y = 0; y < N; y += 1) {
    const out = new Float64Array(N)
    const row = pixels[y]
    for (let u = 0; u < M; u += 1) {
      let sum = 0
      const cosU = cos[u]
      for (let n = 0; n < N; n += 1) sum += row[n] * cosU[n]
      out[u] = sum * (u === 0 ? c0 : ck)
    }
    rowDct[y] = out
  }

  // 1D DCT along columns of rowDct -> dct[v][u]
  const dct: Float64Array[] = new Array(M)
  for (let v = 0; v < M; v += 1) {
    const out = new Float64Array(M)
    const cosV = cos[v]
    const factor = v === 0 ? c0 : ck
    for (let u = 0; u < M; u += 1) {
      let sum = 0
      for (let n = 0; n < N; n += 1) sum += rowDct[n][u] * cosV[n]
      out[u] = sum * factor
    }
    dct[v] = out
  }

  // Median of the 64 values, excluding the DC term [0][0].
  const sample: number[] = []
  for (let v = 0; v < M; v += 1) {
    for (let u = 0; u < M; u += 1) {
      if (v === 0 && u === 0) continue
      sample.push(dct[v][u])
    }
  }
  sample.sort((a, b) => a - b)
  const median = (sample[Math.floor(sample.length / 2) - 1] + sample[Math.floor(sample.length / 2)]) / 2

  // Build 64-bit hash.
  let bits = ""
  for (let v = 0; v < M; v += 1) {
    for (let u = 0; u < M; u += 1) {
      bits += dct[v][u] > median ? "1" : "0"
    }
  }

  // Convert to 16-char hex.
  let hex = ""
  for (let i = 0; i < bits.length; i += 4) {
    hex += Number.parseInt(bits.slice(i, i + 4), 2).toString(16)
  }
  return hex
}

/**
 * Convert Hamming distance to a similarity percentage (0-100).
 */
export function phashSimilarityFromDistance(distance: number, hashBits = 64): number {
  const similarity = (1 - distance / hashBits) * 100
  return Math.max(0, Math.min(100, similarity))
}
