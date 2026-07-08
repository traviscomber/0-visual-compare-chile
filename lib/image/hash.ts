import { createHash } from "node:crypto"

export function calculateSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex")
}

/**
 * Hamming distance between two equal-length binary hashes (hex-encoded).
 * Returns the number of differing bits.
 */
export function calculateHammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) {
    throw new Error("Hashes must have equal length to compute Hamming distance")
  }

  let distance = 0
  for (let i = 0; i < hashA.length; i += 1) {
    const a = Number.parseInt(hashA[i], 16)
    const b = Number.parseInt(hashB[i], 16)
    let xor = a ^ b
    while (xor) {
      distance += xor & 1
      xor >>= 1
    }
  }
  return distance
}
