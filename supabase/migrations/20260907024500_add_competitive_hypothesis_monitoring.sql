create table if not exists public.competitive_hypothesis_monitoring_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hypothesis_id uuid not null references public.competitive_hypotheses(id) on delete cascade,
  assessment text not null check (assessment in ('strengthening_signal','contradictory_signal','source_degradation','stale_review_due','no_material_change')),
  summary text not null check (char_length(summary) between 8 and 1200),
  evidence_new jsonb not null default '[]'::jsonb,
  evidence_contradictory jsonb not null default '[]'::jsonb,
  source_coverage jsonb not null default '{}'::jsonb,
  query_context jsonb not null default '{}'::jsonb,
  review_status text not null default 'pending' check (review_status in ('pending','reviewed','dismissed','not_required')),
  review_reason text null check (review_reason is null or char_length(review_reason) <= 1200),
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists competitive_hypothesis_monitoring_due_idx
  on public.competitive_hypothesis_monitoring_events(hypothesis_id, observed_at desc);
create index if not exists competitive_hypothesis_monitoring_user_review_idx
  on public.competitive_hypothesis_monitoring_events(user_id, review_status, observed_at desc);

alter table public.competitive_hypothesis_monitoring_events enable row level security;

-- Monitoring evidence and human review lineage remain server-owned.
revoke all on table public.competitive_hypothesis_monitoring_events from anon, authenticated;
