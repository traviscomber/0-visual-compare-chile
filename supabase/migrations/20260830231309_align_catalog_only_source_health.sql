update public.intelligence_sources
set is_active = false,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'operational_status', 'catalog_only',
      'activation_requirement', 'Implement connector plus ingestion telemetry before enabling this source in health/freshness.'
    ),
    updated_at = now()
where source_key in ('registro_empresas','superir','wipo_lex_cl')
  and not exists (
    select 1
    from public.intelligence_source_state st
    where st.source_id = intelligence_sources.id
  );
