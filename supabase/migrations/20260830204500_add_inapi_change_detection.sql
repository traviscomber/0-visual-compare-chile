create table if not exists public.intelligence_change_baselines (
  source_key text not null references public.intelligence_sources(source_key) on delete restrict,
  entity_type text not null check (entity_type = any (array['patent'::text,'trademark'::text])),
  dataset text not null,
  initialized_at timestamptz not null default now(),
  last_completed_sync_run_id uuid references public.inapi_sync_runs(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (source_key, entity_type, dataset)
);

create index if not exists intelligence_change_baselines_sync_run_idx
  on public.intelligence_change_baselines (last_completed_sync_run_id)
  where last_completed_sync_run_id is not null;

create table if not exists public.intelligence_source_states (
  id uuid primary key default gen_random_uuid(),
  source_key text not null references public.intelligence_sources(source_key) on delete restrict,
  entity_type text not null check (entity_type = any (array['patent'::text,'trademark'::text])),
  dataset text not null,
  source_record_id text not null,
  fingerprint text not null,
  snapshot jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_source_states_identity_uq unique (source_key, entity_type, dataset, source_record_id)
);

create index if not exists intelligence_source_states_last_seen_idx
  on public.intelligence_source_states (source_key, entity_type, last_seen_at desc);

create table if not exists public.intelligence_source_events (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid references public.inapi_sync_runs(id) on delete set null,
  source_key text not null references public.intelligence_sources(source_key) on delete restrict,
  entity_type text not null check (entity_type = any (array['patent'::text,'trademark'::text])),
  dataset text not null,
  source_record_id text not null,
  event_key text not null,
  event_type text not null check (event_type = any (array[
    'new_record'::text,
    'status_changed'::text,
    'registration_added'::text,
    'applicant_changed'::text,
    'classification_changed'::text,
    'title_changed'::text,
    'record_updated'::text
  ])),
  title text not null,
  summary text,
  search_text text not null default '',
  source_url text,
  source_date date,
  observed_at timestamptz not null default now(),
  materiality text not null check (materiality = any (array['alta'::text,'media'::text,'baja'::text])),
  changed_fields text[] not null default '{}'::text[],
  before_snapshot jsonb,
  after_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint intelligence_source_events_event_key_uq unique (event_key)
);

create index if not exists intelligence_source_events_observed_idx
  on public.intelligence_source_events (observed_at desc);
create index if not exists intelligence_source_events_entity_observed_idx
  on public.intelligence_source_events (entity_type, observed_at desc);
create index if not exists intelligence_source_events_source_entity_observed_idx
  on public.intelligence_source_events (source_key, entity_type, observed_at desc);
create index if not exists intelligence_source_events_record_idx
  on public.intelligence_source_events (source_key, entity_type, source_record_id, observed_at desc);
create index if not exists intelligence_source_events_sync_run_idx
  on public.intelligence_source_events (sync_run_id)
  where sync_run_id is not null;
create index if not exists intelligence_source_events_search_trgm_idx
  on public.intelligence_source_events using gin (search_text gin_trgm_ops);

alter table public.intelligence_change_baselines enable row level security;
alter table public.intelligence_source_states enable row level security;
alter table public.intelligence_source_events enable row level security;

revoke all on table public.intelligence_change_baselines from anon, authenticated;
revoke all on table public.intelligence_source_states from anon, authenticated;
revoke all on table public.intelligence_source_events from anon, authenticated;

grant select, insert, update, delete on table public.intelligence_change_baselines to service_role;
grant select, insert, update, delete on table public.intelligence_source_states to service_role;
grant select, insert, update, delete on table public.intelligence_source_events to service_role;
