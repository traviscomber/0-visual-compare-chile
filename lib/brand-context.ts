import { API_PORTAL_MARCAS, API_PORTAL_NIZA, API_PORTAL_VIENA } from "@/lib/api-portal-data"
import { inferClassificationHints, searchClassificationCatalog } from "@/lib/classification-knowledge"
import { resetSearchEngine } from "@/lib/search-engine"
import type {
  BrandTaxonomyContext,
  BrandTaxonomyMatch,
  BrandTaxonomySnapshot,
} from "@/types/comparison"
import type { SearchResult } from "@/types/marca"

interface BuildBrandContextInput {
  image_id: string
  filename: string
  metadata_hint?: string | null
}

const searchEngine = resetSearchEngine(API_PORTAL_MARCAS)

export function buildBrandTaxonomyContext({
  image_id,
  filename,
  metadata_hint,
}: BuildBrandContextInput): BrandTaxonomySnapshot | null {
  const sourceText = [filename, metadata_hint].filter(Boolean).join(" ").trim()
  if (!sourceText) return null

  const normalizedQuery = normalizeQuery(sourceText)
  const nizaHints = detectCodes(sourceText, API_PORTAL_NIZA.map((item) => item.codigo))
  const vienaHints = detectCodes(sourceText, API_PORTAL_VIENA.map((item) => item.codigo))
  const semanticHints = inferClassificationHints(sourceText)
  const nameQuery = extractNameQuery(sourceText, [...nizaHints, ...vienaHints])

  const matches = new Map<string, BrandTaxonomyMatch>()

  const addMatches = (results: SearchResult[]) => {
    for (const result of results) {
      const current = matches.get(result.marca.id)
      const next: BrandTaxonomyMatch = {
        id: result.marca.id,
        nombre: result.marca.nombre,
        solicitante: result.marca.solicitante,
        numeroRegistro: result.marca.numeroRegistro,
        relevancia: Math.round(result.relevancia),
        matchType: result.matchType,
        niza: [...result.marca.niza],
        viena: [...result.marca.viena],
      }

      if (!current || next.relevancia > current.relevancia) {
        matches.set(result.marca.id, next)
      }
    }
  }

  for (const code of nizaHints) {
    addMatches(searchEngine.search({ query: code, type: "niza" }))
  }

  for (const code of vienaHints) {
    addMatches(searchEngine.search({ query: code, type: "viena" }))
  }

  for (const code of semanticHints.niza) {
    addMatches(searchEngine.search({ query: code, type: "niza" }))
  }

  for (const code of semanticHints.viena) {
    addMatches(searchEngine.search({ query: code, type: "viena" }))
  }

  for (const nizaMatch of searchClassificationCatalog("niza", sourceText, 3)) {
    addMatches(searchEngine.search({ query: nizaMatch.codigo, type: "niza" }))
  }

  for (const vienaMatch of searchClassificationCatalog("viena", sourceText, 3)) {
    addMatches(searchEngine.search({ query: vienaMatch.codigo, type: "viena" }))
  }

  if (nameQuery.length >= 3) {
    addMatches(searchEngine.search({ query: nameQuery, type: "nombre" }))
  }

  const orderedMatches = [...matches.values()].sort((a, b) => {
    if (b.relevancia !== a.relevancia) return b.relevancia - a.relevancia
    if (a.matchType === b.matchType) return a.nombre.localeCompare(b.nombre)
    return matchTypeRank(b.matchType) - matchTypeRank(a.matchType)
  })

  if (!orderedMatches.length && !nizaHints.length && !vienaHints.length) {
    return null
  }

  return {
    image_id,
    filename,
    source: nameQuery.length >= 3 ? "filename" : "metadata",
    query: nameQuery.length >= 3 ? nameQuery : normalizeQuery(sourceText),
    normalized_query: normalizedQuery,
    hints: {
      niza: [...new Set([...nizaHints, ...semanticHints.niza])],
      viena: [...new Set([...vienaHints, ...semanticHints.viena])],
    },
    primary_match: orderedMatches[0] ?? null,
    matches: orderedMatches.slice(0, 3),
  }
}

export function mergeBrandTaxonomyContext(
  imageA: BrandTaxonomySnapshot | null,
  imageB: BrandTaxonomySnapshot | null,
): BrandTaxonomyContext | null {
  if (!imageA && !imageB) return null

  const sharedNiza = intersectStrings(
    imageA?.primary_match?.niza ?? imageA?.hints.niza ?? [],
    imageB?.primary_match?.niza ?? imageB?.hints.niza ?? [],
  )
  const sharedViena = intersectStrings(
    imageA?.primary_match?.viena ?? imageA?.hints.viena ?? [],
    imageB?.primary_match?.viena ?? imageB?.hints.viena ?? [],
  )

  return {
    image_a: imageA,
    image_b: imageB,
    shared_niza: sharedNiza,
    shared_viena: sharedViena,
  }
}

function extractNameQuery(sourceText: string, excludedCodes: string[]): string {
  const withoutCodes = excludedCodes.reduce((acc, code) => acc.replaceAll(code, " "), sourceText)
  return normalizeQuery(withoutCodes)
    .replace(/\b(v[0-9]+|img|image|logo|brand|mark|marca|final|copy|draft)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeQuery(value: string): string {
  return value
    .replace(/\.[a-z0-9]+$/i, " ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9.\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function detectCodes(sourceText: string, codes: string[]): string[] {
  return codes.filter((code) => {
    const pattern = new RegExp(`(^|[^0-9A-Za-z])${escapeRegExp(code)}([^0-9A-Za-z]|$)`, "i")
    return pattern.test(sourceText)
  })
}

function intersectStrings(left: string[], right: string[]): string[] {
  const rightSet = new Set(right)
  return left.filter((item) => rightSet.has(item))
}

function matchTypeRank(type: BrandTaxonomyMatch["matchType"]): number {
  if (type === "exact") return 3
  if (type === "partial") return 2
  return 1
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
