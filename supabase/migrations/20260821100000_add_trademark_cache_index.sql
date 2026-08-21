CREATE INDEX IF NOT EXISTS idx_comparisons_trademark_cache
  ON public.comparisons (user_id, created_at DESC)
  WHERE result_json ? 'marca';
