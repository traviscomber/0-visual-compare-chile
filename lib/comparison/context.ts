import type { BrandTaxonomyContext, BrandTaxonomySnapshot, OcrSummary } from "@/types/comparison"

export interface ComparisonContextPayload {
  brand_context?: BrandTaxonomyContext | null
  result_json?: {
    brand_context?: BrandTaxonomyContext | null
    ocr?: {
      a?: OcrSummary | null
      b?: OcrSummary | null
    } | null
  } | null
}

export function resolveBrandContext(
  payload: ComparisonContextPayload | null | undefined,
): BrandTaxonomyContext | null {
  if (!payload) return null
  return payload.brand_context ?? payload.result_json?.brand_context ?? null
}

export function resolvePrimaryBrandName(payload: ComparisonContextPayload | null | undefined): string | null {
  const context = resolveBrandContext(payload)
  return context?.image_a?.primary_match?.nombre ?? context?.image_b?.primary_match?.nombre ?? null
}

export function resolveComparisonOcr(
  payload: ComparisonContextPayload | null | undefined,
): { a: OcrSummary | null; b: OcrSummary | null } {
  const ocr = payload?.result_json?.ocr ?? null
  return {
    a: ocr?.a ?? null,
    b: ocr?.b ?? null,
  }
}

export function normalizeBrandSnapshot(snapshot: BrandTaxonomySnapshot | null | undefined): BrandTaxonomySnapshot | null {
  if (!snapshot) return null

  return {
    ...snapshot,
    hints: {
      niza: [...(snapshot.hints?.niza ?? [])],
      viena: [...(snapshot.hints?.viena ?? [])],
    },
    matches: [...(snapshot.matches ?? [])],
    primary_match: snapshot.primary_match
      ? {
          ...snapshot.primary_match,
          niza: [...(snapshot.primary_match.niza ?? [])],
          viena: [...(snapshot.primary_match.viena ?? [])],
        }
      : null,
  }
}
