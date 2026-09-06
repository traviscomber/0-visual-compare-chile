insert into public.intelligence_sources (
  source_key, name, authority, base_url, source_type, freshness_policy, is_active, metadata
) values
  (
    'fne_competition',
    'Fiscalía Nacional Económica · Competencia y Fusiones',
    'Fiscalía Nacional Económica',
    'https://www.fne.gob.cl/search/operaciones_resultados.php',
    'official_web',
    'bajo_demanda',
    true,
    jsonb_build_object(
      'domain','competition',
      'runtime_mode','on_demand',
      'client','lib/intelligence/fne-competition.ts',
      'api_route','/api/intelligence/competition',
      'evidence_policy','official_document_url',
      'automation_allowed',true
    )
  ),
  (
    'tdlc_jurisprudence',
    'TDLC · Jurisprudencia de Libre Competencia',
    'Tribunal de Defensa de la Libre Competencia',
    'https://www.tdlc.cl/jurisprudencias/',
    'official_web',
    'bajo_demanda',
    true,
    jsonb_build_object(
      'domain','competition_case_law',
      'runtime_mode','on_demand',
      'client','lib/intelligence/tdlc-competition.ts',
      'api_route','/api/intelligence/competition',
      'evidence_policy','official_decision_page',
      'legal_notice','Web publication does not constitute legal notification.',
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
