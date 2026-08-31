create table public.intelligence_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  dedupe_key text not null,
  source_type text not null default 'portfolio_gap' check (source_type in ('portfolio_gap')),
  own_identity_id uuid not null references public.intelligence_company_identities(id) on delete restrict,
  competitor_identity_id uuid not null references public.intelligence_company_identities(id) on delete restrict,
  asset_type text not null check (asset_type in ('patent', 'trademark')),
  classification text not null check (classification in ('IPC', 'Niza')),
  code text not null check (length(btrim(code)) between 1 and 32),
  score integer not null check (score between 0 and 100),
  tier text not null check (tier in ('alta', 'media', 'observacion')),
  headline text not null,
  recommended_action text not null,
  guardrail text not null,
  factors jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new', 'reviewed', 'accepted', 'discarded', 'converted_to_action')),
  discard_reason text,
  created_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  accepted_by uuid references auth.users(id) on delete restrict,
  accepted_at timestamptz,
  discarded_by uuid references auth.users(id) on delete restrict,
  discarded_at timestamptz,
  converted_by uuid references auth.users(id) on delete restrict,
  converted_at timestamptz,
  case_id uuid references public.cases(id) on delete set null,
  action_id uuid references public.case_actions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, dedupe_key),
  check (
    (status = 'discarded' and discard_reason is not null and length(btrim(discard_reason)) >= 5)
    or (status <> 'discarded' and discard_reason is null)
  ),
  check ((status = 'converted_to_action' and case_id is not null and action_id is not null) or status <> 'converted_to_action')
);

create index intelligence_recommendations_org_status_idx
  on public.intelligence_recommendations (organization_id, status, updated_at desc);
create index intelligence_recommendations_competitor_idx
  on public.intelligence_recommendations (competitor_identity_id, updated_at desc);
create index intelligence_recommendations_created_by_idx
  on public.intelligence_recommendations (created_by);
create index intelligence_recommendations_reviewed_by_idx
  on public.intelligence_recommendations (reviewed_by) where reviewed_by is not null;
create index intelligence_recommendations_accepted_by_idx
  on public.intelligence_recommendations (accepted_by) where accepted_by is not null;
create index intelligence_recommendations_discarded_by_idx
  on public.intelligence_recommendations (discarded_by) where discarded_by is not null;
create index intelligence_recommendations_converted_by_idx
  on public.intelligence_recommendations (converted_by) where converted_by is not null;
create index intelligence_recommendations_case_idx
  on public.intelligence_recommendations (case_id) where case_id is not null;
create index intelligence_recommendations_action_idx
  on public.intelligence_recommendations (action_id) where action_id is not null;

alter table public.intelligence_recommendations enable row level security;
revoke all on table public.intelligence_recommendations from anon, authenticated;
grant select, insert, update, delete on table public.intelligence_recommendations to service_role;

create policy intelligence_recommendations_service_role
  on public.intelligence_recommendations
  for all
  to service_role
  using (true)
  with check (true);
