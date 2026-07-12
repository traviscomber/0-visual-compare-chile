import type { InapiSearchType } from "@/lib/inapi/client"

export type InapiPresetKey = "alphabet" | "niza-core" | "top-brands"

export interface InapiSyncJob {
  query: string
  searchType: InapiSearchType
}

export function buildInapiPresetJobs(preset: InapiPresetKey): InapiSyncJob[] {
  if (preset === "alphabet") {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => ({
      query: letter,
      searchType: "nombre" as const,
    }))
  }

  if (preset === "niza-core") {
    return Array.from({ length: 45 }, (_, index) => String(index + 1).padStart(2, "0")).map((code) => ({
      query: code,
      searchType: "clase" as const,
    }))
  }

  return [
    { query: "VISUAL", searchType: "nombre" },
    { query: "COMPARE", searchType: "nombre" },
    { query: "LOGO", searchType: "nombre" },
    { query: "MARCA", searchType: "nombre" },
    { query: "BRAND", searchType: "nombre" },
  ]
}

export function isInapiPresetKey(value: unknown): value is InapiPresetKey {
  return value === "alphabet" || value === "niza-core" || value === "top-brands"
}
