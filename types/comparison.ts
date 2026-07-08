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
  /** EXIF + forensic signals — null/false-ish if EXIF was missing on either side. */
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
  diff_storage_path: string | null
  created_at: string
}

export interface ExifSummary {
  camera: string | null
  software: string | null
  taken_at: string | null
  gps: { lat: number; lng: number } | null
  was_edited: boolean
}

export interface ComparisonResultPayload {
  id: string
  similarity_score: number
  classification: string
  recommendation: string | null
  signals: ComparisonSignals
  diff_url: string | null
  ela_url_a: string | null
  ela_url_b: string | null
  exif_a: ExifSummary | null
  exif_b: ExifSummary | null
  created_at: string
}
