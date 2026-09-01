insert into public.intelligence_sources (
  source_key,name,authority,base_url,source_type,license,freshness_policy,is_active,metadata
)
values (
  'gdelt_raw_feed',
  'GDELT Event Database Raw Feed',
  'GDELT Project',
  'https://data.gdeltproject.org/gdeltv2',
  'event_data',
  null,
  '15-minute event exports; synchronized with a landing offset',
  true,
  jsonb_build_object(
    'domain','global_event_signals',
    'automation_allowed',true,
    'transport','raw_event_export',
    'update_interval_minutes',15,
    'canonical_identity','GLOBALEVENTID',
    'role','canonical_context_evidence'
  )
)
on conflict (source_key) do update set
  name=excluded.name,
  authority=excluded.authority,
  base_url=excluded.base_url,
  source_type=excluded.source_type,
  freshness_policy=excluded.freshness_policy,
  is_active=true,
  metadata=excluded.metadata,
  updated_at=now();

create table if not exists public.gdelt_raw_artifacts (
  id uuid primary key default gen_random_uuid(),
  artifact_timestamp timestamptz not null unique,
  artifact_url text not null unique,
  artifact_bytes bigint,
  sha256 text,
  status text not null default 'processing' check (status in ('processing','completed','failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  row_count integer not null default 0 check (row_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  ingestion_run_id uuid references public.intelligence_ingestion_runs(id) on delete set null,
  retrieved_at timestamptz,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gdelt_event_records (
  global_event_id bigint primary key,
  event_date date,
  date_added timestamptz,
  actor1_code text,
  actor1_name text,
  actor1_country_code text,
  actor1_known_group_code text,
  actor1_type1_code text,
  actor1_type2_code text,
  actor1_type3_code text,
  actor2_code text,
  actor2_name text,
  actor2_country_code text,
  actor2_known_group_code text,
  actor2_type1_code text,
  actor2_type2_code text,
  actor2_type3_code text,
  is_root_event boolean,
  event_code text,
  event_base_code text,
  event_root_code text,
  quad_class smallint,
  goldstein_scale double precision,
  num_mentions integer,
  num_sources integer,
  num_articles integer,
  avg_tone double precision,
  actor1_geo_full_name text,
  actor1_geo_country_code text,
  actor1_geo_lat double precision,
  actor1_geo_long double precision,
  actor2_geo_full_name text,
  actor2_geo_country_code text,
  actor2_geo_lat double precision,
  actor2_geo_long double precision,
  action_geo_full_name text,
  action_geo_country_code text,
  action_geo_lat double precision,
  action_geo_long double precision,
  source_url text,
  raw_payload jsonb not null,
  latest_artifact_id uuid not null references public.gdelt_raw_artifacts(id) on delete restrict,
  artifact_timestamp timestamptz not null,
  source_retrieved_at timestamptz not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gdelt_event_versions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.gdelt_raw_artifacts(id) on delete restrict,
  global_event_id bigint not null,
  raw_payload jsonb not null,
  raw_row text not null,
  source_retrieved_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (artifact_id, global_event_id)
);

create index if not exists idx_gdelt_event_records_event_date
  on public.gdelt_event_records (event_date desc);
create index if not exists idx_gdelt_event_records_date_added
  on public.gdelt_event_records (date_added desc);
create index if not exists idx_gdelt_event_records_source_url
  on public.gdelt_event_records (source_url)
  where source_url is not null;
create index if not exists idx_gdelt_event_records_action_country
  on public.gdelt_event_records (action_geo_country_code, event_date desc)
  where action_geo_country_code is not null;
create index if not exists idx_gdelt_event_versions_event
  on public.gdelt_event_versions (global_event_id, source_retrieved_at desc);
create index if not exists idx_gdelt_raw_artifacts_status
  on public.gdelt_raw_artifacts (status, artifact_timestamp desc);

alter table public.gdelt_raw_artifacts enable row level security;
alter table public.gdelt_event_records enable row level security;
alter table public.gdelt_event_versions enable row level security;

create or replace function public.claim_gdelt_raw_artifact(
  p_artifact_timestamp timestamptz,
  p_artifact_url text,
  p_artifact_bytes bigint,
  p_ingestion_run_id uuid
)
returns table (artifact_id uuid, claimed boolean, current_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.gdelt_raw_artifacts%rowtype;
begin
  insert into public.gdelt_raw_artifacts (
    artifact_timestamp, artifact_url, artifact_bytes, ingestion_run_id, status, started_at, updated_at
  ) values (
    p_artifact_timestamp, p_artifact_url, p_artifact_bytes, p_ingestion_run_id, 'processing', now(), now()
  )
  on conflict (artifact_timestamp) do nothing;

  select * into v_row
  from public.gdelt_raw_artifacts
  where artifact_timestamp = p_artifact_timestamp
  for update;

  if v_row.status = 'completed' then
    return query select v_row.id, false, v_row.status;
    return;
  end if;

  if v_row.status = 'processing' and v_row.ingestion_run_id is distinct from p_ingestion_run_id
     and v_row.started_at > now() - interval '10 minutes' then
    return query select v_row.id, false, v_row.status;
    return;
  end if;

  if v_row.ingestion_run_id is distinct from p_ingestion_run_id then
    update public.gdelt_raw_artifacts
    set status='processing',
        attempt_count=attempt_count+1,
        ingestion_run_id=p_ingestion_run_id,
        artifact_url=p_artifact_url,
        artifact_bytes=coalesce(p_artifact_bytes,artifact_bytes),
        started_at=now(),
        finished_at=null,
        error_message=null,
        updated_at=now()
    where id=v_row.id
    returning * into v_row;
  end if;

  return query select v_row.id, true, v_row.status;
end;
$$;

revoke all on function public.claim_gdelt_raw_artifact(timestamptz,text,bigint,uuid) from public;
revoke all on function public.claim_gdelt_raw_artifact(timestamptz,text,bigint,uuid) from anon;
revoke all on function public.claim_gdelt_raw_artifact(timestamptz,text,bigint,uuid) from authenticated;
grant execute on function public.claim_gdelt_raw_artifact(timestamptz,text,bigint,uuid) to service_role;
