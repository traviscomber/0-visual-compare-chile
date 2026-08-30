create table if not exists public.intelligence_company_entity_links (
  identity_id uuid not null references public.intelligence_company_identities(id) on delete cascade,
  entity_id uuid not null references public.intelligence_entities(id) on delete cascade,
  link_type text not null check (link_type in ('legacy_exact_name','same_rut','verified_manual','source_verified')),
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  source_scope text not null default 'videntia',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (identity_id, entity_id, link_type)
);

create table if not exists public.intelligence_company_relationships (
  id uuid primary key default gen_random_uuid(),
  from_identity_id uuid not null references public.intelligence_company_identities(id) on delete cascade,
  to_identity_id uuid not null references public.intelligence_company_identities(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('parent_of','subsidiary_of','group_member_of','same_group','acquired_by','other')),
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  evidence_source_key text references public.intelligence_sources(source_key) on delete restrict,
  evidence_record_id text,
  observed_at timestamptz not null default now(),
  valid_from date,
  valid_to date,
  is_manual boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_identity_id <> to_identity_id),
  unique (from_identity_id, to_identity_id, relationship_type, evidence_source_key, evidence_record_id)
);

create index if not exists intelligence_company_entity_links_entity_idx on public.intelligence_company_entity_links (entity_id, confidence desc);
create index if not exists intelligence_company_relationships_from_idx on public.intelligence_company_relationships (from_identity_id, relationship_type, confidence desc);
create index if not exists intelligence_company_relationships_to_idx on public.intelligence_company_relationships (to_identity_id, relationship_type, confidence desc);

alter table public.intelligence_company_entity_links enable row level security;
alter table public.intelligence_company_relationships enable row level security;
revoke all on table public.intelligence_company_entity_links from anon, authenticated;
revoke all on table public.intelligence_company_relationships from anon, authenticated;
grant select, insert, update, delete on table public.intelligence_company_entity_links to service_role;
grant select, insert, update, delete on table public.intelligence_company_relationships to service_role;

drop policy if exists intelligence_company_entity_links_service_all on public.intelligence_company_entity_links;
create policy intelligence_company_entity_links_service_all on public.intelligence_company_entity_links for all to service_role using (true) with check (true);
drop policy if exists intelligence_company_relationships_service_all on public.intelligence_company_relationships;
create policy intelligence_company_relationships_service_all on public.intelligence_company_relationships for all to service_role using (true) with check (true);

insert into public.intelligence_company_entity_links(identity_id,entity_id,link_type,confidence,source_scope,metadata)
select distinct i.id,e.id,'legacy_exact_name',0.900,'legacy_intelligence_graph',jsonb_build_object('canonical_identity_key',i.canonical_identity_key,'legacy_normalized_name',e.normalized_name)
from public.intelligence_company_identities i
join public.intelligence_entities e on e.entity_type='company' and public.normalize_company_identity(e.canonical_name)=i.canonical_identity_key
where i.canonical_identity_key is not null
on conflict (identity_id,entity_id,link_type) do nothing;

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
    from public.intelligence_company_entity_links l join public.intelligence_entities e on e.id=l.entity_id
    where l.identity_id=p_identity_id
  ), marks as (
    select distinct m.id,m.canonical_name,m.external_key,r.relationship_type,r.confidence
    from legacy_links l join public.intelligence_relationships r on r.from_entity_id=l.entity_id
    join public.intelligence_entities m on m.id=r.to_entity_id and m.entity_type='trademark'
    where r.relationship_type in ('owns','applied_for')
    order by r.confidence desc,m.canonical_name limit 60
  ), corporate as (
    select cr.id,cr.relationship_type,cr.confidence,cr.evidence_source_key,cr.evidence_record_id,cr.observed_at,cr.valid_from,cr.valid_to,
           case when cr.from_identity_id=p_identity_id then cr.to_identity_id else cr.from_identity_id end as related_identity_id,
           case when cr.from_identity_id=p_identity_id then 'outbound' else 'inbound' end as direction
    from public.intelligence_company_relationships cr where cr.from_identity_id=p_identity_id or cr.to_identity_id=p_identity_id
  ), corporate_named as (
    select c.*,i.canonical_name as related_name,i.country as related_country
    from corporate c join public.intelligence_company_identities i on i.id=c.related_identity_id
    order by c.confidence desc,c.observed_at desc
  ), activity as (
    select count(*)::int as total_12m,count(*) filter (where entity_type='patent')::int as patents_12m,count(*) filter (where entity_type='trademark')::int as trademarks_12m,
           count(distinct unnest_code.code)::int as classification_count
    from public.intelligence_company_ip_activity a left join lateral unnest(a.classification_codes) unnest_code(code) on true
    where a.identity_id=p_identity_id and a.filing_date >= current_date - 365
  )
  select jsonb_build_object(
    'identity',coalesce((select to_jsonb(i) from identity i),'null'::jsonb),
    'legacy',jsonb_build_object('linkedEntities',(select count(*) from legacy_links),'links',coalesce((select jsonb_agg(to_jsonb(l) order by l.confidence desc,l.legacy_name) from legacy_links l),'[]'::jsonb),'brands',coalesce((select jsonb_agg(to_jsonb(m)) from marks m),'[]'::jsonb),'brandCount',(select count(*) from marks)),
    'corporateRelationships',coalesce((select jsonb_agg(to_jsonb(c)) from corporate_named c),'[]'::jsonb),
    'activity12m',coalesce((select to_jsonb(a) from activity a),'{}'::jsonb),
    'methodology',jsonb_build_object('identityLink','Sólo coincidencia normalizada exacta o evidencia explícita; no se fusionan subsidiarias por similitud.','corporateLinks','Parent/subsidiary/group requieren evidencia fuente o validación manual.')
  );
$$;

revoke execute on function public.get_company_graph_v2(uuid) from public, anon, authenticated;
grant execute on function public.get_company_graph_v2(uuid) to service_role;
