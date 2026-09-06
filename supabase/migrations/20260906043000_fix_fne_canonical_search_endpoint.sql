update public.intelligence_sources
set base_url = 'https://www.fne.gob.cl/search/investigaciones_resultados.php',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'search_endpoint', '/search/investigaciones_resultados.php',
      'query_field', 'Partes',
      'coverage', 'investigations_and_concentrations'
    ),
    updated_at = now()
where source_key = 'fne_competition';
