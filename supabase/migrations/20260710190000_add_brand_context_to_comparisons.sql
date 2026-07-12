-- Add a first-class brand context column for comparison results.
-- result_json keeps the full payload; this column makes the key MVP signal queryable.

ALTER TABLE IF EXISTS comparisons
  ADD COLUMN IF NOT EXISTS brand_context JSONB;

CREATE INDEX IF NOT EXISTS idx_comparisons_brand_context
  ON comparisons
  USING GIN (brand_context);

COMMENT ON COLUMN comparisons.brand_context IS 'Structured brand-taxonomy context derived from OCR, filename, and Niza/Viena inference.';
