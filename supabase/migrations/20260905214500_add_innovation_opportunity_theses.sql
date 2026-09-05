begin;

create table if not exists public.innovation_opportunity_theses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  dedupe_key text not null,
  title text not null,
  status text not null default 'exploring' check (status in ('exploring','watching','prototype','rejected','archived')),
  source_website_url text not null,
  source_generated_at timestamptz not null,
  model text not null,
  decision text not null check (decision in ('build','investigate','watch','reject')),
  evidence_state text not null check (evidence_state in ('observed','mixed','hypothesis')),
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  overall_score smallint not null check (overall_score between 0 and 100),
  evidence_strength smallint not null check (evidence_strength between 0 and 100),
  timing_score smallint not null check (timing_score between 0 and 100),
  strategic_fit smallint not null check (strategic_fit between 0 and 100),
  capability_reuse_score smallint not null check (capability_reuse_score between 0 and 100),
  novelty_score smallint not null check (novelty_score between 0 and 100),
  defensibility_score smallint not null check (defensibility_score between 0 and 100),
  research_queries text[] not null default '{}',
  watch_triggers text[] not null default '{}',
  thesis jsonb not null,
  context_summary jsonb not null default '{}'::jsonb,
  last_researched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, dedupe_key)
);

create table if not exists public.innovation_opportunity_research_runs (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.innovation_opportunity_theses(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_type text not null check (run_type in ('generated','live_research','scheduled_research','human_review')),
  research_queries text[] not null default '{}',
  evidence_summary jsonb not null default '{}'::jsonb,
  score_snapshot jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  observed_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists innovation_opportunity_theses_org_status_idx
  on public.innovation_opportunity_theses (organization_id, status, overall_score desc, updated_at desc);
create index if not exists innovation_opportunity_theses_research_idx
  on public.innovation_opportunity_theses (status, last_researched_at nulls first)
  where status in ('exploring','watching','prototype');
create index if not exists innovation_opportunity_research_runs_opportunity_idx
  on public.innovation_opportunity_research_runs (opportunity_id, observed_at desc);
create index if not exists innovation_opportunity_research_runs_org_idx
  on public.innovation_opportunity_research_runs (organization_id, observed_at desc);

create or replace function public.touch_innovation_opportunity_thesis_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.touch_innovation_opportunity_thesis_updated_at() from public, anon, authenticated;

drop trigger if exists innovation_opportunity_theses_touch_updated_at on public.innovation_opportunity_theses;
create trigger innovation_opportunity_theses_touch_updated_at
before update on public.innovation_opportunity_theses
for each row execute function public.touch_innovation_opportunity_thesis_updated_at();

alter table public.innovation_opportunity_theses enable row level security;
alter table public.innovation_opportunity_research_runs enable row level security;

revoke all on table public.innovation_opportunity_theses from public, anon, authenticated;
revoke all on table public.innovation_opportunity_research_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.innovation_opportunity_theses to service_role;
grant select, insert, update, delete on table public.innovation_opportunity_research_runs to service_role;

create policy innovation_opportunity_theses_service_role
on public.innovation_opportunity_theses
for all
to service_role
using (true)
with check (true);

create policy innovation_opportunity_research_runs_service_role
on public.innovation_opportunity_research_runs
for all
to service_role
using (true)
with check (true);

comment on table public.innovation_opportunity_theses is
  'Human-promoted Opportunity Engine product theses. Generated hypotheses remain ephemeral until explicitly promoted.';
comment on table public.innovation_opportunity_research_runs is
  'Immutable research and score snapshots that explain how a promoted innovation thesis changes over time.';

commit;
