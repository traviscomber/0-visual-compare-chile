alter table public.intelligence_sources
  drop constraint if exists intelligence_sources_source_type_check;

alter table public.intelligence_sources
  add constraint intelligence_sources_source_type_check
  check (source_type = any (array[
    'official_api'::text,
    'official_dataset'::text,
    'official_web'::text,
    'judicial_repository'::text,
    'public_api'::text,
    'reference_only'::text
  ]));

insert into public.intelligence_sources
  (source_key, name, authority, base_url, source_type, license, freshness_policy, is_active, metadata)
values
  (
    'openalex',
    'OpenAlex',
    'OurResearch',
    'https://openalex.org/',
    'public_api',
    null,
    'bajo_demanda',
    true,
    '{"domain":"science_technology","automation_allowed":true,"api":"https://api.openalex.org"}'::jsonb
  ),
  (
    'crossref',
    'Crossref REST API',
    'Crossref',
    'https://www.crossref.org/',
    'public_api',
    null,
    'bajo_demanda',
    true,
    '{"domain":"scholarly_metadata","automation_allowed":true,"api":"https://api.crossref.org"}'::jsonb
  ),
  (
    'epo_ops',
    'EPO Open Patent Services',
    'European Patent Office',
    'https://www.epo.org/en/searching-for-patents/data/web-services/ops',
    'official_api',
    'EPO OPS Terms',
    'bajo_demanda',
    true,
    '{"domain":"patents","automation_allowed":true,"requires_credentials":true,"api":"https://ops.epo.org/3.2/rest-services"}'::jsonb
  ),
  (
    'gdelt',
    'GDELT Project',
    'GDELT Project',
    'https://www.gdeltproject.org/',
    'public_api',
    null,
    'bajo_demanda',
    true,
    '{"domain":"news_signals","automation_allowed":true,"api":"https://api.gdeltproject.org/api/v2/doc/doc"}'::jsonb
  ),
  (
    'wipo_global_brand_db',
    'WIPO Global Brand Database',
    'World Intellectual Property Organization',
    'https://www.wipo.int/en/web/global-brand-database',
    'reference_only',
    'WIPO Global Brand Database Terms of Use',
    'manual',
    false,
    '{"domain":"trademarks","automation_allowed":false,"reason":"WIPO terms prohibit automated queries and scraping"}'::jsonb
  )
on conflict (source_key) do update set
  name = excluded.name,
  authority = excluded.authority,
  base_url = excluded.base_url,
  source_type = excluded.source_type,
  license = excluded.license,
  freshness_policy = excluded.freshness_policy,
  is_active = excluded.is_active,
  metadata = public.intelligence_sources.metadata || excluded.metadata,
  updated_at = now();
