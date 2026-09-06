-- Remove catalog entries that have no connector, evidence, ingestion, watch events,
-- source events, baselines, or company relationships. Health history is telemetry-only
-- and is removed through ON DELETE CASCADE.
delete from public.intelligence_sources
where source_key in (
  'gdelt',
  'superir',
  'wipo_lex_cl',
  'wipo_global_brand_db'
);
