create table if not exists public.intelligence_strategic_changes (
  id uuid primary key default gen_random_uuid(),
  change_key text not null unique,
  subject_type text not null check (subject_type = any (array['company'::text])),
  subject_key text not null,
  subject_name text not null,
  change_type text not null check (change_type = any (array[
    'protection_acceleration'::text,
    'cross_ip_expansion'::text,
    'technology_concentration'::text,
    'portfolio_maturation'::text,
    'ownership_concentration'::text
  ])),
  title text not null,
  observed_fact text not null,
  interpretation text not null,
  why_it_matters text not null,
  materiality text not null check (materiality = any (array['alta'::text,'media'::text,'baja'::text])),
  confidence smallint not null check (confidence between 0 and 100),
  event_count integer not null check (event_count >= 2),
  distinct_records integer not null check (distinct_records >= 2),
  patent_events integer not null default 0 check (patent_events >= 0),
  trademark_events integer not null default 0 check (trademark_events >= 0),
  classification_codes text[] not null default '{}'::text[],
  period_start date not null,
  period_end date not null,
  first_observed_at timestamptz not null,
  last_observed_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_strategic_changes_period_check check (period_end >= period_start)
);

create index if not exists intelligence_strategic_changes_period_idx
  on public.intelligence_strategic_changes (period_start desc, materiality, confidence desc);
create index if not exists intelligence_strategic_changes_subject_idx
  on public.intelligence_strategic_changes (subject_key, last_observed_at desc);
create index if not exists intelligence_strategic_changes_type_idx
  on public.intelligence_strategic_changes (change_type, last_observed_at desc);

create table if not exists public.intelligence_strategic_change_evidence (
  strategic_change_id uuid not null references public.intelligence_strategic_changes(id) on delete cascade,
  source_event_id uuid not null references public.intelligence_source_events(id) on delete cascade,
  evidence_role text not null,
  weight smallint not null default 1 check (weight between 1 and 10),
  created_at timestamptz not null default now(),
  primary key (strategic_change_id, source_event_id)
);

create index if not exists intelligence_strategic_change_evidence_event_idx
  on public.intelligence_strategic_change_evidence (source_event_id, strategic_change_id);

alter table public.intelligence_strategic_changes enable row level security;
alter table public.intelligence_strategic_change_evidence enable row level security;

revoke all on table public.intelligence_strategic_changes from public, anon, authenticated;
revoke all on table public.intelligence_strategic_change_evidence from public, anon, authenticated;
grant all on table public.intelligence_strategic_changes to service_role;
grant all on table public.intelligence_strategic_change_evidence to service_role;

drop policy if exists intelligence_strategic_changes_service_role_all on public.intelligence_strategic_changes;
create policy intelligence_strategic_changes_service_role_all
  on public.intelligence_strategic_changes
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists intelligence_strategic_change_evidence_service_role_all on public.intelligence_strategic_change_evidence;
create policy intelligence_strategic_change_evidence_service_role_all
  on public.intelligence_strategic_change_evidence
  for all
  to service_role
  using (true)
  with check (true);
