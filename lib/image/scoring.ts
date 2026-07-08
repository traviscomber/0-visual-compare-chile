import { CLASSIFICATION_RECOMMENDATION } from "@/lib/format"
import { calculateHammingDistance } from "@/lib/image/hash"
import { phashSimilarityFromDistance } from "@/lib/image/phash"
import {
  aspectRatioSimilarity,
  calculateMetadataSimilarity,
  colorSimilarity,
  type MetadataLike,
} from "@/lib/image/metadata"
import type { Classification, ComparisonSignals, ForensicSignals } from "@/types/comparison"

export function classifyScore(score: number, exactMatch: boolean): Classification {
  if (exactMatch) return "exact_match"
  if (score >= 92) return "near_duplicate"
  if (score >= 75) return "visually_similar"
  if (score >= 55) return "partially_similar"
  return "different"
}

export function getRecommendation(classification: Classification, forensics: ForensicSignals): string {
  const base = CLASSIFICATION_RECOMMENDATION[classification]
  if (forensics.ela_alert) {
    return `${base} Atención: ELA detectó posibles ediciones locales.`
  }
  if (forensics.any_edited) {
    return `${base} Una de las imágenes fue procesada con software de edición.`
  }
  return base
}

export interface ScoringInput {
  sha256_a: string
  sha256_b: string
  phash_a: string | null
  phash_b: string | null
  pixel_similarity: number | null
  metadata_a: MetadataLike
  metadata_b: MetadataLike
  forensics: ForensicSignals
}

export interface ScoringResult {
  similarity_score: number
  classification: Classification
  signals: ComparisonSignals
  recommendation: string
}

export function calculateFinalScore(input: ScoringInput): ScoringResult {
  const exactMatch = input.sha256_a === input.sha256_b

  let phashDistance: number | null = null
  let phashSimilarity = 0
  if (input.phash_a && input.phash_b && input.phash_a.length === input.phash_b.length) {
    phashDistance = calculateHammingDistance(input.phash_a, input.phash_b)
    const bits = input.phash_a.length * 4
    phashSimilarity = phashSimilarityFromDistance(phashDistance, bits)
  }

  const colorSim = colorSimilarity(input.metadata_a, input.metadata_b)
  const aspectSim = aspectRatioSimilarity(input.metadata_a, input.metadata_b)
  const metaSim = calculateMetadataSimilarity(input.metadata_a, input.metadata_b)
  const pixelSim = input.pixel_similarity ?? 0

  // Weighted blend. Pixel similarity (real diff) carries the most weight when
  // available; pHash captures structural similarity; color/metadata add context.
  // Fallbacks adjust the weights when pixel similarity is missing.
  const hasPixel = input.pixel_similarity != null
  let finalScore = exactMatch
    ? 100
    : hasPixel
      ? Math.round(
          (pixelSim * 0.45 + phashSimilarity * 0.35 + colorSim * 0.1 + aspectSim * 0.05 + metaSim * 0.05) * 100,
        ) / 100
      : Math.round((phashSimilarity * 0.6 + colorSim * 0.2 + aspectSim * 0.1 + metaSim * 0.1) * 100) / 100

  // Forensics adjustment: when ELA flags a probable edit, push the score
  // away from "near duplicate" so operators must inspect manually.
  if (!exactMatch && input.forensics.ela_alert) {
    finalScore = Math.max(0, finalScore - 8)
  }

  const classification = classifyScore(finalScore, exactMatch)

  const signals: ComparisonSignals = {
    exact_match: exactMatch,
    phash_distance: phashDistance,
    phash_similarity: Math.round(phashSimilarity * 100) / 100,
    pixel_similarity: hasPixel ? Math.round(pixelSim * 100) / 100 : null,
    color_similarity: Math.round(colorSim * 100) / 100,
    aspect_ratio_similarity: Math.round(aspectSim * 100) / 100,
    metadata_similarity: Math.round(metaSim * 100) / 100,
    forensics: input.forensics,
  }

  return {
    similarity_score: finalScore,
    classification,
    signals,
    recommendation: getRecommendation(classification, input.forensics),
  }
}
