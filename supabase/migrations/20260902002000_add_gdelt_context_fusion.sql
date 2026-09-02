insert into public.intelligence_sources (
  source_key,name,authority,base_url,source_type,license,freshness_policy,is_active,metadata
)
values
  ('gdelt_mentions','GDELT Event Mentions 2.0','GDELT Project','https://data.gdeltproject.org/gdeltv2','official_dataset',null,'15-minute mention exports; synchronized with GDELT Events',true,jsonb_build_object('domain','global_event_mentions','automation_allowed',true,'canonical_join','GLOBALEVENTID','document_join','MentionIdentifier')),
  ('gdelt_gkg','GDELT Global Knowledge Graph 2.1','GDELT Project','https://data.gdeltproject.org/gdeltv2','official_dataset',null,'15-minute GKG exports; synchronized with GDELT Events',true,jsonb_build_object('domain','global_knowledge_graph','automation_allowed',true,'projection_policy','mention_linked_documents_only','document_identity','V2DOCUMENTIDENTIFIER')),
  ('gleif','GLEIF LEI Data','Global Legal Entity Identifier Foundation','https://api.gleif.org/api/v1','official_api',null,'on demand; authoritative LEI identity resolution',true,jsonb_build_object('domain','legal_entities','automation_allowed',true,'resolution_policy','normalized_exact_only','relationship_policy','official_evidence_only'))
on conflict (source_key) do update set
  name=excluded.name,authority=excluded.authority,base_url=excluded.base_url,source_type=excluded.source_type,
  freshness_policy=excluded.freshness_policy,is_active=true,metadata=excluded.metadata,updated_at=now();

create table if not exists public.gdelt_context_artifacts (
  id uuid primary key default gen_random_uuid(), artifact_kind text not null check (artifact_kind in ('mentions','gkg')), artifact_timestamp timestamptz not null,
  artifact_url text not null unique, artifact_bytes bigint, sha256 text, status text not null default 'processing' check (status in ('processing','completed','failed')),
  attempt_count integer not null default 1 check (attempt_count > 0), row_count integer not null default 0 check (row_count >= 0), inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0), rejected_count integer not null default 0 check (rejected_count >= 0), filtered_count integer not null default 0 check (filtered_count >= 0),
  ingestion_run_id uuid references public.intelligence_ingestion_runs(id) on delete set null, retrieved_at timestamptz, started_at timestamptz not null default now(), finished_at timestamptz,
  error_message text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (artifact_kind, artifact_timestamp)
);

create table if not exists public.gdelt_event_mentions (
  id uuid primary key default gen_random_uuid(), artifact_id uuid not null references public.gdelt_context_artifacts(id) on delete restrict, global_event_id bigint not null,
  event_time_date timestamptz, mention_time_date timestamptz, mention_type smallint, mention_source_name text, mention_identifier text not null, sentence_id integer,
  actor1_char_offset integer, actor2_char_offset integer, action_char_offset integer, in_raw_text boolean, confidence smallint, mention_doc_len integer, mention_doc_tone double precision,
  translation_info text, extras text, raw_payload jsonb not null, raw_row text not null, source_row_hash text not null, source_retrieved_at timestamptz not null,
  created_at timestamptz not null default now(), unique (artifact_id, source_row_hash)
);

create table if not exists public.gdelt_gkg_documents (
  gkg_record_id text primary key, document_identifier text not null, document_date timestamptz, source_collection_identifier text, source_common_name text,
  themes text[] not null default '{}'::text[], persons text[] not null default '{}'::text[], organizations text[] not null default '{}'::text[], locations jsonb not null default '[]'::jsonb,
  tone double precision, positive_score double precision, negative_score double precision, polarity double precision, activity_reference_density double precision,
  raw_payload jsonb not null, latest_artifact_id uuid not null references public.gdelt_context_artifacts(id) on delete restrict, source_retrieved_at timestamptz not null,
  first_seen_at timestamptz not null default now(), last_seen_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.gdelt_gkg_document_versions (
  id uuid primary key default gen_random_uuid(), artifact_id uuid not null references public.gdelt_context_artifacts(id) on delete restrict, gkg_record_id text not null,
  document_identifier text not null, raw_payload jsonb not null, raw_row text not null, source_row_hash text not null, source_retrieved_at timestamptz not null,
  created_at timestamptz not null default now(), unique (artifact_id, gkg_record_id)
);

create index if not exists idx_gdelt_raw_artifacts_ingestion_run on public.gdelt_raw_artifacts (ingestion_run_id) where ingestion_run_id is not null;
create index if not exists idx_gdelt_event_records_latest_artifact on public.gdelt_event_records (latest_artifact_id);
create index if not exists idx_gdelt_context_artifacts_status on public.gdelt_context_artifacts (artifact_kind,status,artifact_timestamp desc);
create index if not exists idx_gdelt_context_artifacts_ingestion_run on public.gdelt_context_artifacts (ingestion_run_id) where ingestion_run_id is not null;
create index if not exists idx_gdelt_event_mentions_event on public.gdelt_event_mentions (global_event_id, mention_time_date desc);
create index if not exists idx_gdelt_event_mentions_identifier on public.gdelt_event_mentions (mention_identifier);
create index if not exists idx_gdelt_event_mentions_artifact on public.gdelt_event_mentions (artifact_id);
create index if not exists idx_gdelt_gkg_documents_identifier on public.gdelt_gkg_documents (document_identifier);
create index if not exists idx_gdelt_gkg_documents_latest_artifact on public.gdelt_gkg_documents (latest_artifact_id);
create index if not exists idx_gdelt_gkg_versions_artifact on public.gdelt_gkg_document_versions (artifact_id);
create index if not exists idx_gdelt_gkg_versions_identifier on public.gdelt_gkg_document_versions (document_identifier);

alter table public.gdelt_context_artifacts enable row level security;
alter table public.gdelt_event_mentions enable row level security;
alter table public.gdelt_gkg_documents enable row level security;
alter table public.gdelt_gkg_document_versions enable row level security;
revoke all on public.gdelt_context_artifacts from public, anon, authenticated;
revoke all on public.gdelt_event_mentions from public, anon, authenticated;
revoke all on public.gdelt_gkg_documents from public, anon, authenticated;
revoke all on public.gdelt_gkg_document_versions from public, anon, authenticated;
grant select,insert,update,delete on public.gdelt_context_artifacts to service_role;
grant select,insert,update,delete on public.gdelt_event_mentions to service_role;
grant select,insert,update,delete on public.gdelt_gkg_documents to service_role;
grant select,insert,update,delete on public.gdelt_gkg_document_versions to service_role;
create policy gdelt_context_artifacts_service_all on public.gdelt_context_artifacts for all to service_role using (true) with check (true);
create policy gdelt_event_mentions_service_all on public.gdelt_event_mentions for all to service_role using (true) with check (true);
create policy gdelt_gkg_documents_service_all on public.gdelt_gkg_documents for all to service_role using (true) with check (true);
create policy gdelt_gkg_document_versions_service_all on public.gdelt_gkg_document_versions for all to service_role using (true) with check (true);

create or replace function public.claim_gdelt_context_artifact(p_artifact_kind text,p_artifact_timestamp timestamptz,p_artifact_url text,p_artifact_bytes bigint,p_ingestion_run_id uuid)
returns table (artifact_id uuid, claimed boolean, current_status text) language plpgsql security definer set search_path = public as $$
declare v_row public.gdelt_context_artifacts%rowtype;
begin
  if p_artifact_kind not in ('mentions','gkg') then raise exception 'Unsupported GDELT context artifact kind'; end if;
  insert into public.gdelt_context_artifacts (artifact_kind,artifact_timestamp,artifact_url,artifact_bytes,ingestion_run_id,status,started_at,updated_at)
  values (p_artifact_kind,p_artifact_timestamp,p_artifact_url,p_artifact_bytes,p_ingestion_run_id,'processing',now(),now()) on conflict (artifact_kind,artifact_timestamp) do nothing;
  select * into v_row from public.gdelt_context_artifacts where artifact_kind=p_artifact_kind and artifact_timestamp=p_artifact_timestamp for update;
  if v_row.status='completed' then return query select v_row.id,false,v_row.status; return; end if;
  if v_row.status='processing' and v_row.ingestion_run_id is distinct from p_ingestion_run_id and v_row.started_at > now()-interval '10 minutes' then return query select v_row.id,false,v_row.status; return; end if;
  if v_row.ingestion_run_id is distinct from p_ingestion_run_id then
    update public.gdelt_context_artifacts set status='processing',attempt_count=attempt_count+1,ingestion_run_id=p_ingestion_run_id,artifact_url=p_artifact_url,
      artifact_bytes=coalesce(p_artifact_bytes,artifact_bytes),started_at=now(),finished_at=null,error_message=null,updated_at=now() where id=v_row.id returning * into v_row;
  end if;
  return query select v_row.id,true,v_row.status;
end; $$;
revoke all on function public.claim_gdelt_context_artifact(text,timestamptz,text,bigint,uuid) from public,anon,authenticated;
grant execute on function public.claim_gdelt_context_artifact(text,timestamptz,text,bigint,uuid) to service_role;

create or replace function public.search_gdelt_watch_signals(p_query text,p_since timestamptz,p_limit integer default 12)
returns table (global_event_id bigint,event_date date,actor1_name text,actor2_name text,action_geo_full_name text,event_code text,goldstein_scale double precision,event_tone double precision,source_url text,mention_count bigint,distinct_sources bigint,average_confidence numeric,document_tone numeric,organizations text[],persons text[],themes text[],primary_document_identifier text)
language sql stable security definer set search_path=public as $$
  with needle as (select lower(trim(coalesce(p_query,''))) as q,greatest(1,least(coalesce(p_limit,12),50)) as lim),
  recent as (
    select e.* from public.gdelt_event_records e, needle n where e.source_retrieved_at >= coalesce(p_since,now()-interval '14 days') and n.q <> '' and (
      lower(coalesce(e.actor1_name,'')) like '%'||n.q||'%' or lower(coalesce(e.actor2_name,'')) like '%'||n.q||'%' or exists (
        select 1 from public.gdelt_event_mentions m join public.gdelt_gkg_documents g on g.document_identifier=m.mention_identifier
        where m.global_event_id=e.global_event_id and (lower(array_to_string(g.organizations,' ')) like '%'||n.q||'%' or lower(array_to_string(g.persons,' ')) like '%'||n.q||'%' or lower(array_to_string(g.themes,' ')) like '%'||n.q||'%')))
    order by e.source_retrieved_at desc limit 250),
  mention_stats as (select m.global_event_id,count(*) mention_count,count(distinct m.mention_source_name) filter (where m.mention_source_name is not null) distinct_sources,round(avg(m.confidence)::numeric,2) average_confidence,round(avg(m.mention_doc_tone)::numeric,3) document_tone,min(m.mention_identifier) primary_document_identifier from public.gdelt_event_mentions m join recent r on r.global_event_id=m.global_event_id group by m.global_event_id),
  docs as (select distinct m.global_event_id,g.gkg_record_id from public.gdelt_event_mentions m join recent r on r.global_event_id=m.global_event_id join public.gdelt_gkg_documents g on g.document_identifier=m.mention_identifier),
  orgs as (select d.global_event_id,array_agg(distinct x.value order by x.value) values from docs d join public.gdelt_gkg_documents g on g.gkg_record_id=d.gkg_record_id cross join lateral unnest(g.organizations) x(value) group by d.global_event_id),
  people as (select d.global_event_id,array_agg(distinct x.value order by x.value) values from docs d join public.gdelt_gkg_documents g on g.gkg_record_id=d.gkg_record_id cross join lateral unnest(g.persons) x(value) group by d.global_event_id),
  topics as (select d.global_event_id,array_agg(distinct x.value order by x.value) values from docs d join public.gdelt_gkg_documents g on g.gkg_record_id=d.gkg_record_id cross join lateral unnest(g.themes) x(value) group by d.global_event_id)
  select r.global_event_id,r.event_date,r.actor1_name,r.actor2_name,r.action_geo_full_name,r.event_code,r.goldstein_scale,r.avg_tone,r.source_url,coalesce(ms.mention_count,0),coalesce(ms.distinct_sources,0),ms.average_confidence,ms.document_tone,coalesce(o.values,'{}'::text[]),coalesce(p.values,'{}'::text[]),coalesce(t.values,'{}'::text[]),ms.primary_document_identifier
  from recent r left join mention_stats ms on ms.global_event_id=r.global_event_id left join orgs o on o.global_event_id=r.global_event_id left join people p on p.global_event_id=r.global_event_id left join topics t on t.global_event_id=r.global_event_id order by r.source_retrieved_at desc limit (select lim from needle);
$$;
revoke all on function public.search_gdelt_watch_signals(text,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.search_gdelt_watch_signals(text,timestamptz,integer) to service_role;
