export type Classification =
  | "exact_match"
  | "near_duplicate"
  | "visually_similar"
  | "partially_similar"
  | "different"

export interface ComparisonSignals {
  exact_match: boolean
  phash_distance: number | null
  phash_similarity: number
  pixel_similarity: number | null
  color_similarity: number
  aspect_ratio_similarity: number
  metadata_similarity: number
  /** EXIF plus forensic signals. Values can be null when EXIF is missing on either side. */
  forensics: ForensicSignals
}

export interface ForensicSignals {
  /** Both files reported the same camera Make+Model. */
  camera_match: boolean | null
  /** Both files reported the same Software. */
  software_match: boolean | null
  /** At least one file was processed by a known photo-editing app. */
  any_edited: boolean
  /** Difference in seconds between the two DateTimeOriginal timestamps. */
  timestamp_delta_seconds: number | null
  /** Distance in meters between the two GPS points. */
  gps_distance_meters: number | null
  /** Mean ELA tampering score for image A (0=clean, 100=heavy editing). */
  ela_score_a: number | null
  /** Mean ELA tampering score for image B. */
  ela_score_b: number | null
  /** True when ELA flagged either image (>40). */
  ela_alert: boolean
}

export interface ImageRecord {
  id: string
  user_id: string
  filename: string
  storage_bucket: string
  storage_path: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  sha256: string
  phash: string | null
  metadata: Record<string, unknown>
  status: string
  created_at: string
  deleted_at: string | null
}

export interface ComparisonRecord {
  id: string
  user_id: string
  image_a_id: string
  image_b_id: string
  similarity_score: number
  classification: Classification
  signals: ComparisonSignals
  recommendation: string | null
  result_json: Record<string, unknown>
  brand_context?: BrandTaxonomyContext | null
  diff_storage_path: string | null
  created_at: string
}

export interface BrandTaxonomyMatch {
  id: string
  nombre: string
  solicitante: string
  numeroRegistro: string
  relevancia: number
  matchType: "exact" | "partial" | "fuzzy"
  niza: string[]
  viena: string[]
}

export interface BrandTaxonomySnapshot {
  image_id: string
  filename: string
  source: "filename" | "metadata"
  query: string
  normalized_query: string
  hints: {
    niza: string[]
    viena: string[]
  }
  primary_match: BrandTaxonomyMatch | null
  matches: BrandTaxonomyMatch[]
}

export type BrandTaxonomySnapshotLike = Partial<
  Omit<BrandTaxonomySnapshot, "hints" | "primary_match" | "matches">
> & {
  hints?: {
    niza?: string[]
    viena?: string[]
  }
  primary_match?: {
    id?: string
    nombre?: string | null
    solicitante?: string
    numeroRegistro?: string
    relevancia?: number
    matchType?: "exact" | "partial" | "fuzzy"
    niza?: string[]
    viena?: string[]
  } | null
  matches?: Array<{
    id?: string
    nombre?: string | null
    solicitante?: string
    numeroRegistro?: string
    relevancia?: number
    matchType?: "exact" | "partial" | "fuzzy"
    niza?: string[]
    viena?: string[]
  }>
}

export interface BrandTaxonomyContext {
  image_a?: BrandTaxonomySnapshotLike | null
  image_b?: BrandTaxonomySnapshotLike | null
  shared_niza?: string[]
  shared_viena?: string[]
}

export interface OcrSummary {
  text?: string | null
  confidence?: number | null
  language?: string | null
}

export interface ExifSummary {
  camera: string | null
  software: string | null
  taken_at: string | null
  gps: { lat: number; lng: number } | null
  was_edited: boolean
}

export interface AiAnalysis {
  /** Short GPT-4o mini narrative describing both brands and their relationship. */
  summary: string
  /** Key visual similarities the model detected. */
  similarities: string[]
  /** Key visual differences the model detected. */
  differences: string[]
  /** 0-100 AI-only similarity score. */
  ai_score: number
  /** low | medium | high — risk of brand confusion per the model. */
  confusion_risk: "low" | "medium" | "high"
  /** Dominant hex colors extracted from each image. */
  colors_a: string[]
  colors_b: string[]
  /** Number of tokens used for cost tracking. */
  tokens_used: number
}

export interface ComparisonResultPayload {
  id: string
  similarity_score: number
  classification: Classification
  recommendation: string | null
  signals: ComparisonSignals
  diff_url: string | null
  ela_url_a: string | null
  ela_url_b: string | null
  exif_a: ExifSummary | null
  exif_b: ExifSummary | null
  brand_context?: BrandTaxonomyContext | null
  ocr_a?: OcrSummary | null
  ocr_b?: OcrSummary | null
  created_at: string
  /** Optional GPT-4o mini enrichment — present when OPENAI_API_KEY is set. */
  ai_analysis?: AiAnalysis | null
}
