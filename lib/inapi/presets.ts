import type { InapiSearchType } from "@/lib/inapi/client"

export type InapiPresetKey = "alphabet" | "niza-core" | "top-brands" | "phase1-10k"

export interface InapiSyncJob {
  query: string
  searchType: InapiSearchType
}

const PHASE1_NAME_SEEDS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "AL",
  "AR",
  "BIO",
  "CASA",
  "CHILE",
  "CLUB",
  "DATA",
  "ECO",
  "EL",
  "FARMA",
  "GO",
  "LAB",
  "LA",
  "MAX",
  "MI",
  "MUNDO",
  "NET",
  "NOVA",
  "PLUS",
  "PRO",
  "PUNTO",
  "RED",
  "SAN",
  "SMART",
  "SOL",
  "SUR",
  "TEC",
  "TU",
  "VITA",
]

const PHASE1_APPLICANT_SEEDS = [
  "SPA",
  "S.A.",
  "LTDA",
  "LIMITADA",
  "INVERSIONES",
  "COMERCIAL",
  "SERVICIOS",
  "HOLDING",
  "TECNOLOGIA",
  "INDUSTRIAL",
]

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

  if (preset === "phase1-10k") {
    const jobs: InapiSyncJob[] = [
      ...Array.from({ length: 45 }, (_, index) => ({
        query: String(index + 1).padStart(2, "0"),
        searchType: "clase" as const,
      })),
      ...PHASE1_NAME_SEEDS.map((query) => ({
        query,
        searchType: "nombre" as const,
      })),
      ...PHASE1_APPLICANT_SEEDS.map((query) => ({
        query,
        searchType: "solicitante" as const,
      })),
    ]

    const seen = new Set<string>()
    return jobs.filter((job) => {
      const key = `${job.searchType}:${job.query}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
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
  return value === "alphabet" || value === "niza-core" || value === "top-brands" || value === "phase1-10k"
}
