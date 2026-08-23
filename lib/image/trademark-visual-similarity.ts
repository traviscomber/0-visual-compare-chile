import { calculateHammingDistance } from "@/lib/image/hash"
import { calculatePerceptualHash, phashSimilarityFromDistance } from "@/lib/image/phash"
import { enrichCandidatesWithOfficialImages } from "@/lib/inapi/visual-detail"
import { buildVisualFingerprint, compareVisualFingerprints, type FigurativeSimilarity, type VisualFingerprint } from "@/lib/image/visual-fingerprint"
import type { Marca } from "@/types/marca"

export interface TrademarkVisualSignal {
  marcaId: string
  imageUrl?: string
  structuralSimilarity: number | null
  figurativeSimilarity: number | null
  sharedViennaCodes: string[]
  sharedViennaLabels: string[]
  method: "phash+vienna" | "phash" | "vienna"
}

export interface TrademarkVisualAnalysis {
  queryFingerprint: VisualFingerprint
  candidates: Marca[]
  signals: Map<string, TrademarkVisualSignal>
}

const MAX_REMOTE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 5_000
const MAX_CANDIDATES = 6

export async function analyzeTrademarkVisualCandidates(
  queryImageBase64: string | undefined,
  queryViennaCodes: Array<string | { code: string }>,
  candidates: Marca[],
): Promise<TrademarkVisualAnalysis> {
  const signals = new Map<string, TrademarkVisualSignal>()
  const queryFingerprint = buildVisualFingerprint(queryViennaCodes)
  const enriched = await enrichCandidatesWithOfficialImages(candidates.slice(0, MAX_CANDIDATES))

  let queryHash: string | null = null
  if (queryImageBase64) {
    const queryBuffer = Buffer.from(queryImageBase64, "base64")
    if (queryBuffer.length && queryBuffer.length <= MAX_REMOTE_BYTES) {
      try { queryHash = await calculatePerceptualHash(queryBuffer) } catch { queryHash = null }
    }
  }

  for (const candidate of enriched) {
    const figurative = compareVisualFingerprints(queryFingerprint, buildVisualFingerprint(candidate.viena))
    let structuralSimilarity: number | null = null
    let imageUrl: string | undefined

    if (queryHash && candidate.imagenUrl && isAllowedImageUrl(candidate.imagenUrl)) {
      try {
        const buffer = await fetchImageBuffer(candidate.imagenUrl)
        const candidateHash = await calculatePerceptualHash(buffer)
        if (candidateHash.length === queryHash.length) {
          const distance = calculateHammingDistance(queryHash, candidateHash)
          structuralSimilarity = Math.round(phashSimilarityFromDistance(distance, queryHash.length * 4) * 10) / 10
          imageUrl = candidate.imagenUrl
        }
      } catch (error) {
        console.warn("[trademark-visual] candidate image skipped", candidate.id, error instanceof Error ? error.message : String(error))
      }
    }

    if (structuralSimilarity == null && figurative.score == null) continue
    signals.set(candidate.id, {
      marcaId: candidate.id,
      ...(imageUrl ? { imageUrl } : {}),
      structuralSimilarity,
      figurativeSimilarity: figurative.score,
      sharedViennaCodes: figurative.sharedCodes,
      sharedViennaLabels: figurative.sharedLabels,
      method: structuralSimilarity != null && figurative.score != null ? "phash+vienna" : structuralSimilarity != null ? "phash" : "vienna",
    })
  }

  return { queryFingerprint, candidates: mergeEnrichedCandidates(candidates, enriched), signals }
}

/** Backward-compatible pHash-only view for existing callers. */
export async function compareTrademarkCandidateImages(queryImageBase64: string | undefined, candidates: Marca[]) {
  const analysis = await analyzeTrademarkVisualCandidates(queryImageBase64, [], candidates)
  const legacy = new Map<string, { marcaId: string; imageUrl: string; similarity: number; method: "phash" }>()
  for (const [id, signal] of analysis.signals) {
    if (signal.structuralSimilarity == null || !signal.imageUrl) continue
    legacy.set(id, { marcaId: id, imageUrl: signal.imageUrl, similarity: signal.structuralSimilarity, method: "phash" })
  }
  return legacy
}

function mergeEnrichedCandidates(original: Marca[], enriched: Marca[]) {
  const byId = new Map(enriched.map((item) => [item.id, item]))
  return original.map((item) => byId.get(item.id) ?? item)
}

function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return false
    const configured = (process.env.TRADEMARK_IMAGE_ALLOWED_HOSTS ?? "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean)
    return new Set(["buscadormarcas.inapi.cl", ...configured]).has(url.hostname.toLowerCase())
  } catch { return false }
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
  } finally { clearTimeout(timeout) }
}
