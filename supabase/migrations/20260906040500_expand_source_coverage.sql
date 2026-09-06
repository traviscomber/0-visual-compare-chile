-- Expose additional connectors that VIDENTIA already implements and distinguish
-- manual/reference-only sources from broken automated integrations.
insert into public.intelligence_sources (
  source_key, name, authority, base_url, source_type, freshness_policy, is_active, metadata
) values
  (
    'wipo_patentscope_rss',
    'WIPO PATENTSCOPE RSS',
    'World Intellectual Property Organization',
    'https://patentscope.wipo.int/search/',
    'official_api',
    'bajo_demanda',
    true,
    jsonb_build_object(
      'domain','patents',
      'runtime_mode','on_demand',
      'client','lib/intelligence/wipo-patentscope-rss.ts',
      'watch_scanner','lib/intelligence/wipo-patent-watch-scan.ts',
      'automation_allowed',true,
      'feed_policy','public_saved_query_rss_only',
      'trusted_host','patentscope.wipo.int'
    )
  ),
  (
    'cmf_market',
    'CMF · Indicadores de mercado',
    'Comisión para el Mercado Financiero',
    'https://api.cmfchile.cl/api-sbifv3/recursos_api/',
    'official_api',
    'bajo_demanda',
    true,
    jsonb_build_object(
      'domain','market',
      'runtime_mode','credential_gated',
      'client','lib/intelligence/cmf-market.ts',
      'credential_any_of',jsonb_build_array('CMF_API_KEY','SBIF_API_KEY'),
      'automation_allowed',true
    )
  )
on conflict (source_key) do update
set name=excluded.name,
    authority=excluded.authority,
    base_url=excluded.base_url,
    source_type=excluded.source_type,
    freshness_policy=excluded.freshness_policy,
    is_active=excluded.is_active,
    metadata=public.intelligence_sources.metadata || excluded.metadata,
    updated_at=now();

update public.intelligence_sources
set source_type='reference_only',
    freshness_policy='manual',
    is_active=false,
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'automation_policy','manual_only',
      'automation_allowed',false,
      'operational_status','manual_reference',
      'reason','No documented public company-query API was verified; official certificates require Clave Unica.'
    ),
    updated_at=now()
where source_key='superir';

update public.intelligence_sources
set source_type='reference_only',
    freshness_policy='manual',
    is_active=false,
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'automation_policy','manual_only',
      'automation_allowed',false,
      'operational_status','manual_reference',
      'reason','WIPO Lex terms prohibit automated queries and web scraping.'
    ),
    updated_at=now()
where source_key='wipo_lex_cl';

update public.intelligence_sources
set metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object('automation_policy','manual_only')
where source_key='wipo_global_brand_db';
