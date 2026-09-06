insert into public.intelligence_sources (
  source_key,
  name,
  authority,
  base_url,
  source_type,
  freshness_policy,
  is_active,
  metadata,
  updated_at
)
values (
  'sea_seia',
  'SEA · Sistema de Evaluación de Impacto Ambiental',
  'Servicio de Evaluación Ambiental',
  'https://seia.sea.gob.cl/busqueda/buscarProyectoResumenAction.php',
  'official_web',
  'bajo_demanda',
  true,
  jsonb_build_object(
    'client', 'lib/intelligence/sea-seia.ts',
    'domain', 'environmental_regulation',
    'coverage', 'seia_projects',
    'runtime_mode', 'on_demand',
    'automation_allowed', true,
    'search_endpoint', '/busqueda/buscarProyectoResumenAction.php',
    'evidence_policy', 'official_expedient_url',
    'encoding', 'ISO-8859-1'
  ),
  now()
)
on conflict (source_key) do update set
  name = excluded.name,
  authority = excluded.authority,
  base_url = excluded.base_url,
  source_type = excluded.source_type,
  freshness_policy = excluded.freshness_policy,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();
