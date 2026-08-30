create or replace function public.get_company_graph_v2(p_identity_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with identity as (
    select i.id,i.canonical_name,i.country,i.resolution_confidence,i.canonical_identity_key
    from public.intelligence_company_identities i where i.id=p_identity_id
  ), legacy_links as (
    select l.entity_id,l.link_type,l.confidence,e.canonical_name as legacy_name,e.rut
    from public.intelligence_company_entity_links l
    join public.intelligence_entities e on e.id=l.entity_id
    where l.identity_id=p_identity_id
  ), marks_all as (
    select distinct m.id,m.canonical_name,m.external_key,r.relationship_type,r.confidence
    from legacy_links l
    join public.intelligence_relationships r on r.from_entity_id=l.entity_id
    join public.intelligence_entities m on m.id=r.to_entity_id and m.entity_type='trademark'
    where r.relationship_type in ('owns','applied_for')
  ), marks_top as (
    select * from marks_all order by confidence desc,canonical_name limit 60
  ), corporate as (
    select cr.id,cr.relationship_type,cr.confidence,cr.evidence_source_key,cr.evidence_record_id,cr.observed_at,cr.valid_from,cr.valid_to,
           case when cr.from_identity_id=p_identity_id then cr.to_identity_id else cr.from_identity_id end as related_identity_id,
           case when cr.from_identity_id=p_identity_id then 'outbound' else 'inbound' end as direction
    from public.intelligence_company_relationships cr
    where cr.from_identity_id=p_identity_id or cr.to_identity_id=p_identity_id
  ), corporate_named as (
    select c.*,i.canonical_name as related_name,i.country as related_country
    from corporate c join public.intelligence_company_identities i on i.id=c.related_identity_id
    order by c.confidence desc,c.observed_at desc
  ), activity as (
    select count(*)::int as total_12m,
           count(*) filter (where entity_type='patent')::int as patents_12m,
           count(*) filter (where entity_type='trademark')::int as trademarks_12m
    from public.intelligence_company_ip_activity a
    where a.identity_id=p_identity_id and a.filing_date >= current_date - 365
  ), classifications as (
    select count(distinct code)::int as classification_count
    from public.intelligence_company_ip_activity a
    cross join lateral unnest(a.classification_codes) code
    where a.identity_id=p_identity_id and a.filing_date >= current_date - 365
  )
  select jsonb_build_object(
    'identity',coalesce((select to_jsonb(i) from identity i),'null'::jsonb),
    'legacy',jsonb_build_object(
      'linkedEntities',(select count(*) from legacy_links),
      'links',coalesce((select jsonb_agg(to_jsonb(l) order by l.confidence desc,l.legacy_name) from legacy_links l),'[]'::jsonb),
      'brands',coalesce((select jsonb_agg(to_jsonb(m)) from marks_top m),'[]'::jsonb),
      'brandCount',(select count(*) from marks_all)
    ),
    'corporateRelationships',coalesce((select jsonb_agg(to_jsonb(c)) from corporate_named c),'[]'::jsonb),
    'activity12m',coalesce((select to_jsonb(a) || jsonb_build_object('classification_count',(select classification_count from classifications)) from activity a),'{}'::jsonb),
    'methodology',jsonb_build_object(
      'identityLink','Sólo coincidencia normalizada exacta o evidencia explícita; no se fusionan subsidiarias por similitud.',
      'corporateLinks','Parent/subsidiary/group requieren evidencia fuente o validación manual.'
    )
  );
$$;

revoke execute on function public.get_company_graph_v2(uuid) from public, anon, authenticated;
grant execute on function public.get_company_graph_v2(uuid) to service_role;
