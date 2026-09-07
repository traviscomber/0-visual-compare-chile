create table if not exists public.trademark_expansion_corroborations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid not null references public.trademark_watches(id) on delete cascade,
  signal_event_id uuid not null references public.trademark_watch_signal_events(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','running','completed','partial','failed')),
  evidence_state text check (evidence_state in ('supporting_evidence','mixed_evidence','insufficient_evidence','not_observed')),
  new_nice_classes integer[] not null default '{}',
  activity_types text[] not null default '{}',
  evidence jsonb not null default '[]'::jsonb,
  source_coverage jsonb not null default '{}'::jsonb,
  query_context jsonb not null default '{}'::jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (signal_event_id)
);

create index if not exists idx_trademark_expansion_corroborations_user_created
  on public.trademark_expansion_corroborations (user_id, created_at desc);

create index if not exists idx_trademark_expansion_corroborations_status_updated
  on public.trademark_expansion_corroborations (status, updated_at);

alter table public.trademark_expansion_corroborations enable row level security;

revoke all on table public.trademark_expansion_corroborations from anon, authenticated;
grant select, insert, update, delete on table public.trademark_expansion_corroborations to service_role;

comment on table public.trademark_expansion_corroborations is
  'Derived, independently sourced corroboration for INAPI Nice-class expansion signals. Never mutates conviction or human decisions.';
