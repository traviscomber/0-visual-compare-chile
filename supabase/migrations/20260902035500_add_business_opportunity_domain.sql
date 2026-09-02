create table public.business_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  dedupe_key text not null check (length(btrim(dedupe_key)) between 1 and 200),
  title text not null check (length(btrim(title)) between 3 and 240),
  problem_statement text,
  product_concept text,
  target_buyer text,
  target_market text,
  thesis text,
  why_now text,
  tier text not null default 'watch' check (tier in ('watch', 'validate', 'bet_now')),
  status text not null default 'detected' check (status in ('detected', 'reviewed', 'approved', 'rejected', 'converted_to_action')),
  score integer check (score between 0 and 100),
  score_version text,
  score_factors jsonb not null default '{}'::jsonb,
  narrative_provenance jsonb not null default '{}'::jsonb,
  origin text not null default 'engine' check (origin in ('engine', 'human')),
  created_by uuid references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  rejected_by uuid references auth.users(id) on delete restrict,
  rejected_at timestamptz,
  rejection_reason text,
  converted_by uuid references auth.users(id) on delete restrict,
  converted_at timestamptz,
  case_id uuid references public.cases(id) on delete set null,
  action_id uuid references public.case_actions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, dedupe_key),
  unique (id, organization_id),
  constraint business_opportunities_human_origin_actor check (origin <> 'human' or created_by is not null),
  constraint business_opportunities_review_lifecycle check (
    status = 'detected'
    or (reviewed_by is not null and reviewed_at is not null)
  ),
  constraint business_opportunities_approval_lifecycle check (
    status not in ('approved', 'converted_to_action')
    or (approved_by is not null and approved_at is not null)
  ),
  constraint business_opportunities_rejection_lifecycle check (
    (status = 'rejected' and rejected_by is not null and rejected_at is not null and rejection_reason is not null and length(btrim(rejection_reason)) >= 5)
    or (status <> 'rejected' and rejected_by is null and rejected_at is null and rejection_reason is null)
  ),
  constraint business_opportunities_conversion_lifecycle check (
    status <> 'converted_to_action'
    or (converted_by is not null and converted_at is not null and case_id is not null and action_id is not null)
  )
);

create table public.business_opportunity_evidence (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  axis text not null check (axis in ('frontier', 'market_pull', 'company_fit')),
  source_class text not null check (source_class in ('external_signal', 'market_signal', 'company_evidence', 'human_evidence')),
  gate_status text not null default 'context_only' check (gate_status in ('eligible', 'context_only', 'rejected')),
  source_key text not null check (length(btrim(source_key)) between 1 and 120),
  source_record_id text not null check (length(btrim(source_record_id)) between 1 and 500),
  source_url text,
  title text not null check (length(btrim(title)) between 1 and 500),
  summary text,
  observed_at timestamptz not null default now(),
  quality_score integer check (quality_score between 0 and 100),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint business_opportunity_evidence_parent_fk
    foreign key (opportunity_id, organization_id)
    references public.business_opportunities(id, organization_id)
    on delete cascade,
  constraint business_opportunity_evidence_axis_source_class check (
    (axis = 'frontier' and source_class in ('external_signal', 'human_evidence'))
    or (axis = 'market_pull' and source_class in ('market_signal', 'human_evidence'))
    or (axis = 'company_fit' and source_class in ('company_evidence', 'human_evidence'))
  ),
  constraint business_opportunity_evidence_human_actor check (source_class <> 'human_evidence' or created_by is not null),
  unique (opportunity_id, axis, source_key, source_record_id)
);

create index business_opportunities_org_tier_status_idx
  on public.business_opportunities (organization_id, tier, status, updated_at desc);
create index business_opportunities_score_idx
  on public.business_opportunities (organization_id, score desc nulls last, updated_at desc);
create index business_opportunities_case_idx
  on public.business_opportunities (case_id) where case_id is not null;
create index business_opportunities_action_idx
  on public.business_opportunities (action_id) where action_id is not null;
create index business_opportunity_evidence_parent_idx
  on public.business_opportunity_evidence (opportunity_id, gate_status, axis, observed_at desc);
create index business_opportunity_evidence_org_axis_idx
  on public.business_opportunity_evidence (organization_id, axis, gate_status, observed_at desc);

alter table public.business_opportunities enable row level security;
alter table public.business_opportunity_evidence enable row level security;

revoke all on table public.business_opportunities from anon, authenticated;
revoke all on table public.business_opportunity_evidence from anon, authenticated;
grant select, insert, update, delete on table public.business_opportunities to service_role;
grant select, insert, update, delete on table public.business_opportunity_evidence to service_role;

create policy business_opportunities_service_role
  on public.business_opportunities
  for all
  to service_role
  using (true)
  with check (true);

create policy business_opportunity_evidence_service_role
  on public.business_opportunity_evidence
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.business_opportunity_has_gate_axes(p_opportunity_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select count(distinct evidence.axis) = 3
  from public.business_opportunity_evidence as evidence
  where evidence.opportunity_id = p_opportunity_id
    and evidence.gate_status = 'eligible'
    and evidence.axis in ('frontier', 'market_pull', 'company_fit');
$$;

create or replace function public.enforce_business_opportunity_bet_now_gate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_opportunity_id uuid;
  v_tier text;
begin
  v_opportunity_id := case when tg_op = 'DELETE' then old.id else new.id end;

  select opportunity.tier
    into v_tier
  from public.business_opportunities as opportunity
  where opportunity.id = v_opportunity_id;

  if v_tier = 'bet_now' and not public.business_opportunity_has_gate_axes(v_opportunity_id) then
    raise exception 'BET NOW requires eligible frontier, market_pull and company_fit evidence'
      using errcode = '23514';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.enforce_business_opportunity_evidence_gate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_new_id uuid;
  v_old_id uuid;
begin
  if tg_op <> 'DELETE' then
    v_new_id := new.opportunity_id;
    if exists (
      select 1
      from public.business_opportunities as opportunity
      where opportunity.id = v_new_id
        and opportunity.tier = 'bet_now'
    ) and not public.business_opportunity_has_gate_axes(v_new_id) then
      raise exception 'BET NOW requires eligible frontier, market_pull and company_fit evidence'
        using errcode = '23514';
    end if;
  end if;

  if tg_op <> 'INSERT' then
    v_old_id := old.opportunity_id;
    if (v_new_id is null or v_old_id <> v_new_id)
      and exists (
        select 1
        from public.business_opportunities as opportunity
        where opportunity.id = v_old_id
          and opportunity.tier = 'bet_now'
      )
      and not public.business_opportunity_has_gate_axes(v_old_id) then
      raise exception 'BET NOW requires eligible frontier, market_pull and company_fit evidence'
        using errcode = '23514';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create constraint trigger business_opportunities_bet_now_gate
  after insert or update of tier on public.business_opportunities
  deferrable initially deferred
  for each row
  execute function public.enforce_business_opportunity_bet_now_gate();

create constraint trigger business_opportunity_evidence_bet_now_gate
  after insert or update or delete on public.business_opportunity_evidence
  deferrable initially deferred
  for each row
  execute function public.enforce_business_opportunity_evidence_gate();

revoke all on function public.business_opportunity_has_gate_axes(uuid) from public, anon, authenticated;
revoke all on function public.enforce_business_opportunity_bet_now_gate() from public, anon, authenticated;
revoke all on function public.enforce_business_opportunity_evidence_gate() from public, anon, authenticated;
grant execute on function public.business_opportunity_has_gate_axes(uuid) to service_role;
grant execute on function public.enforce_business_opportunity_bet_now_gate() to service_role;
grant execute on function public.enforce_business_opportunity_evidence_gate() to service_role;

comment on table public.business_opportunities is
  'Organization-scoped product/service opportunities derived from evidence. This domain is intentionally separate from IP portfolio-gap recommendations.';
comment on table public.business_opportunity_evidence is
  'Source-addressable evidence for the frontier, market pull and company fit axes. Narrative generation is not evidence.';
comment on column public.business_opportunities.narrative_provenance is
  'Provenance for generated or human-authored opportunity narrative. It never satisfies evidence gates.';
