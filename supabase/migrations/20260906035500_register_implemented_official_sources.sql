-- The source catalog must describe connectors that are actually executable.
-- Query-driven connectors stay on-demand; this does not imply periodic bulk ingestion.
update public.intelligence_sources
set is_active = true,
    freshness_policy = 'bajo_demanda',
    source_type = 'official_dataset',
    base_url = 'https://datos.gob.cl/',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'runtime_mode', 'on_demand',
      'client', 'lib/intelligence/resolver-res.ts',
      'dataset_id', '363edd60-4919-4ff1-b85f-f8e14d61285a',
      'resolution_policy', 'normalized_exact_only',
      'automation_allowed', true,
      'previous_catalog_mode', coalesce(metadata->>'mode', 'catalog_only')
    ),
    updated_at = now()
where source_key = 'registro_empresas';

insert into public.intelligence_sources (
  source_key, name, authority, base_url, source_type, freshness_policy, is_active, metadata
) values
  (
    'bcn_norms',
    'Biblioteca del Congreso Nacional · Normativa',
    'Biblioteca del Congreso Nacional de Chile',
    'https://datos.bcn.cl/',
    'official_api',
    'bajo_demanda',
    true,
    jsonb_build_object('runtime_mode','on_demand','client','lib/intelligence/bcn-regulatory.ts','endpoint','https://datos.bcn.cl/sparql','domain','regulation','automation_allowed',true)
  ),
  (
    'diario_oficial',
    'Diario Oficial de la República de Chile',
    'Ministerio del Interior y Seguridad Pública',
    'https://www.diariooficial.interior.gob.cl/',
    'official_web',
    'bajo_demanda',
    true,
    jsonb_build_object('runtime_mode','on_demand','client','lib/intelligence/diario-oficial-regulatory.ts','domain','regulation','automation_allowed',true)
  ),
  (
    'cmf_norms',
    'CMF · Normativa reciente',
    'Comisión para el Mercado Financiero',
    'https://www.cmfchile.cl/',
    'official_web',
    'bajo_demanda',
    true,
    jsonb_build_object('runtime_mode','on_demand','client','lib/intelligence/cmf-regulatory.ts','domain','regulation','automation_allowed',true)
  ),
  (
    'snifa_sma',
    'SNIFA · Superintendencia del Medio Ambiente',
    'Superintendencia del Medio Ambiente',
    'https://snifa.sma.gob.cl/',
    'official_web',
    'bajo_demanda',
    true,
    jsonb_build_object('runtime_mode','on_demand','client','lib/intelligence/snifa-company-watch.ts','domain','environmental_regulation','automation_allowed',true,'identity_policy','canonical_company_with_verified_rut')
  )
on conflict (source_key) do update
set name = excluded.name,
    authority = excluded.authority,
    base_url = excluded.base_url,
    source_type = excluded.source_type,
    freshness_policy = excluded.freshness_policy,
    is_active = excluded.is_active,
    metadata = public.intelligence_sources.metadata || excluded.metadata,
    updated_at = now();
