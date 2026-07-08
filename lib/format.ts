import type { Classification } from "@/types/comparison"

export const CLASSIFICATION_LABEL: Record<Classification, string> = {
  exact_match: "Coincidencia exacta",
  near_duplicate: "Imágenes casi idénticas",
  visually_similar: "Imágenes muy similares",
  partially_similar: "Similitud parcial",
  different: "Imágenes diferentes",
}

export const CLASSIFICATION_RECOMMENDATION: Record<Classification, string> = {
  exact_match: "Las imágenes parecen corresponder al mismo archivo.",
  near_duplicate: "Las imágenes parecen ser versiones muy similares de la misma evidencia.",
  visually_similar: "Las imágenes tienen alta similitud visual, aunque presentan diferencias.",
  partially_similar: "Las imágenes comparten algunos rasgos visuales, pero no son equivalentes.",
  different: "Las imágenes parecen representar contenidos diferentes.",
}

export type ClassificationTone = "danger" | "warn" | "ok" | "neutral"

export function classificationTone(classification: string): ClassificationTone {
  if (classification === "exact_match" || classification === "near_duplicate") return "danger"
  if (classification === "visually_similar") return "warn"
  if (classification === "different") return "ok"
  return "neutral"
}

export function classificationLabel(classification: string): string {
  return CLASSIFICATION_LABEL[classification as Classification] ?? classification
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatDateLong(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatScore(score: number): string {
  return `${score.toFixed(2)}%`
}
