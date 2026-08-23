import { API_PORTAL_VIENA } from "@/lib/api-portal-data"

export interface VisualFingerprint {
  codes: string[]
  categories: string[]
  divisions: string[]
  labels: string[]
}

export interface FigurativeSimilarity {
  score: number | null
  sharedCodes: string[]
  sharedDivisions: string[]
  sharedCategories: string[]
  sharedLabels: string[]
}

export function buildVisualFingerprint(codes: Array<string | { code: string }>): VisualFingerprint {
  const normalized = [...new Set(codes.map((item) => typeof item === "string" ? item : item.code).map(normalizeViennaCode).filter(Boolean))]
  const categories = [...new Set(normalized.map((code) => code.split(".")[0]).filter(Boolean))]
  const divisions = [...new Set(normalized.map((code) => code.split(".").slice(0, 2).join(".")).filter(Boolean))]
  const labels = normalized.map((code) => API_PORTAL_VIENA.find((item) => item.codigo === code)?.titulo).filter((value): value is string => Boolean(value))
  return { codes: normalized, categories, divisions, labels }
}

export function compareVisualFingerprints(query: VisualFingerprint, candidate: VisualFingerprint): FigurativeSimilarity {
  if (!query.codes.length || !candidate.codes.length) {
    return { score: null, sharedCodes: [], sharedDivisions: [], sharedCategories: [], sharedLabels: [] }
  }

  const sharedCodes = intersection(query.codes, candidate.codes)
  const sharedDivisions = intersection(query.divisions, candidate.divisions)
  const sharedCategories = intersection(query.categories, candidate.categories)
  const sharedLabels = sharedCodes.map((code) => API_PORTAL_VIENA.find((item) => item.codigo === code)?.titulo).filter((value): value is string => Boolean(value))

  const exact = jaccard(query.codes, candidate.codes)
  const division = jaccard(query.divisions, candidate.divisions)
  const category = jaccard(query.categories, candidate.categories)
  const coverage = sharedCodes.length / Math.max(1, Math.min(query.codes.length, candidate.codes.length))
  const score = Math.round(Math.min(1, exact * 0.5 + division * 0.25 + category * 0.1 + coverage * 0.15) * 100)

  return { score, sharedCodes, sharedDivisions, sharedCategories, sharedLabels }
}

function normalizeViennaCode(value: string) {
  const match = value.trim().match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{1,2})\b/)
  if (!match) return ""
  return [match[1], match[2], match[3]].map((part) => part.padStart(2, "0")).join(".")
}

function intersection(a: string[], b: string[]) {
  const right = new Set(b)
  return a.filter((value) => right.has(value))
}

function jaccard(a: string[], b: string[]) {
  const left = new Set(a)
  const right = new Set(b)
  const union = new Set([...left, ...right])
  if (!union.size) return 0
  let common = 0
  for (const value of left) if (right.has(value)) common += 1
  return common / union.size
}
