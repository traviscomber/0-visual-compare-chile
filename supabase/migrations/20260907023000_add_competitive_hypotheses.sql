create table if not exists public.competitive_hypotheses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_event_id uuid not null references public.trademark_watch_signal_events(id) on delete cascade,
  corroboration_id uuid not null references public.trademark_expansion_corroborations(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','accepted','rejected')),
  hypothesis text not null check (char_length(hypothesis) between 10 and 1200),
  evidence_for jsonb not null default '[]'::jsonb,
  evidence_missing jsonb not null default '[]'::jsonb,
  evidence_against jsonb not null default '[]'::jsonb,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  decision_reason text null check (decision_reason is null or char_length(decision_reason) <= 1200),
  decided_by uuid null references auth.users(id) on delete set null,
  decided_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, signal_event_id)
);

create index if not exists competitive_hypotheses_user_status_idx
  on public.competitive_hypotheses(user_id, status, updated_at desc);
create index if not exists competitive_hypotheses_corroboration_idx
  on public.competitive_hypotheses(corroboration_id);

alter table public.competitive_hypotheses enable row level security;

revoke all on table public.competitive_hypotheses from anon, authenticated;
grant select, insert, update on table public.competitive_hypotheses to authenticated;

create policy "competitive hypotheses select own"
  on public.competitive_hypotheses for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "competitive hypotheses insert own"
  on public.competitive_hypotheses for insert
  to authenticated
  with check ((select auth.uid()) = user_id and status = 'draft' and decided_by is null and decided_at is null);

create policy "competitive hypotheses update own"
  on public.competitive_hypotheses for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      (status = 'draft' and decided_by is null and decided_at is null)
      or (status in ('accepted','rejected') and decided_by = (select auth.uid()) and decided_at is not null)
    )
  );
