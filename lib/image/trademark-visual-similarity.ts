import { calculateHammingDistance } from "@/lib/image/hash"
import { calculatePerceptualHash, phashSimilarityFromDistance } from "@/lib/image/phash"
import { enrichCandidatesWithOfficialImages } from "@/lib/inapi/visual-detail"
import type { Marca } from "@/types/marca"

export interface TrademarkVisualSignal {
  marcaId: string
  imageUrl: string
  similarity: number
  method: "phash"
}

const MAX_REMOTE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 5_000
const MAX_CANDIDATES = 6

/**
 * Adds a structural visual signal only when INAPI or another trusted source
 * actually exposes a candidate image. Missing images remain missing: no score
 * is fabricated and no undocumented URL pattern is guessed.
 */
export async function compareTrademarkCandidateImages(
  queryImageBase64: string | undefined,
  candidates: Marca[],
): Promise<Map<string, TrademarkVisualSignal>> {
  const signals = new Map<string, TrademarkVisualSignal>()
  if (!queryImageBase64) return signals

  const queryBuffer = Buffer.from(queryImageBase64, "base64")
  if (!queryBuffer.length || queryBuffer.length > MAX_REMOTE_BYTES) return signals

  let queryHash: string
  try {
    queryHash = await calculatePerceptualHash(queryBuffer)
  } catch {
    return signals
  }

  const enriched = await enrichCandidatesWithOfficialImages(candidates)
  const eligible = enriched.filter((candidate) => Boolean(candidate.imagenUrl)).slice(0, MAX_CANDIDATES)

  for (const candidate of eligible) {
    const url = candidate.imagenUrl
    if (!url || !isAllowedImageUrl(url)) continue
    try {
      const buffer = await fetchImageBuffer(url)
      const candidateHash = await calculatePerceptualHash(buffer)
      if (candidateHash.length !== queryHash.length) continue
      const distance = calculateHammingDistance(queryHash, candidateHash)
      const similarity = Math.round(phashSimilarityFromDistance(distance, queryHash.length * 4) * 10) / 10
      signals.set(candidate.id, { marcaId: candidate.id, imageUrl: url, similarity, method: "phash" })
    } catch (error) {
      console.warn("[trademark-visual] candidate skipped", candidate.id, error instanceof Error ? error.message : String(error))
    }
  }
  return signals
}

function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return false
    const configured = (process.env.TRADEMARK_IMAGE_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
    const allowed = new Set(["buscadormarcas.inapi.cl", ...configured])
    return allowed.has(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

async function fetchImageBuffer(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "error", cache: "force-cache" })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const type = (response.headers.get("content-type") ?? "").toLowerCase()
    if (!type.startsWith("image/")) throw new Error("not an image")
    const declared = Number(response.headers.get("content-length") ?? 0)
    if (declared > MAX_REMOTE_BYTES) throw new Error("image too large")
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > MAX_REMOTE_BYTES) throw new Error("image too large")
    return bytes
  } finally {
    clearTimeout(timeout)
  }
}
