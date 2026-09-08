create table public.intelligence_videntia_improvements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  candidate_key text not null,
  source_kind text not null check (source_kind in ('canonical_internal','product_observability')),
  priority text not null check (priority in ('alta','media','baja')),
  confidence text not null check (confidence in ('alta','media','baja')),
  finding text not null,
  proposal text not null,
  expected_impact text not null,
  validation_plan text not null,
  source text not null,
  status text not null default 'detected' check (status in ('detected','researching','proposed','approved','implemented','measured')),
  human_decision_required boolean not null default true check (human_decision_required = true),
  conviction_delta smallint not null default 0 check (conviction_delta = 0),
  baseline_snapshot jsonb not null default '{}'::jsonb,
  baseline_recorded_at timestamptz,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  decision_note text,
  implementation_ref text,
  implemented_at timestamptz,
  result_snapshot jsonb not null default '{}'::jsonb,
  measured_at timestamptz,
  measurement_note text,
  last_actor_id uuid not null references auth.users(id) on delete restrict,
  transition_note text,
  detected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, candidate_key),
  check (length(btrim(candidate_key)) between 1 and 120),
  check (status not in ('approved','implemented','measured') or (approved_by is not null and approved_at is not null and baseline_recorded_at is not null and baseline_snapshot <> '{}'::jsonb)),
  check (status not in ('implemented','measured') or (implemented_at is not null and implementation_ref is not null and length(btrim(implementation_ref)) >= 3)),
  check (status <> 'measured' or (measured_at is not null and result_snapshot <> '{}'::jsonb and measurement_note is not null and length(btrim(measurement_note)) >= 3))
);

create index intelligence_videntia_improvements_owner_status_idx
  on public.intelligence_videntia_improvements (user_id, organization_id, status, updated_at desc);

create table public.intelligence_videntia_improvement_events (
  id uuid primary key default gen_random_uuid(),
  improvement_id uuid not null references public.intelligence_videntia_improvements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null check (event_type in ('detected','status_transition','baseline_recorded','measurement_recorded','content_refreshed')),
  from_status text,
  to_status text not null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  note text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index intelligence_videntia_improvement_events_item_idx
  on public.intelligence_videntia_improvement_events (improvement_id, created_at desc);
create index intelligence_videntia_improvement_events_owner_idx
  on public.intelligence_videntia_improvement_events (user_id, organization_id, created_at desc);

alter table public.intelligence_videntia_improvements enable row level security;
alter table public.intelligence_videntia_improvement_events enable row level security;

revoke all on table public.intelligence_videntia_improvements from anon, authenticated;
revoke all on table public.intelligence_videntia_improvement_events from anon, authenticated;
grant select, insert, update, delete on table public.intelligence_videntia_improvements to service_role;
grant select, insert, update, delete on table public.intelligence_videntia_improvement_events to service_role;

create policy "videntia improvements service role"
  on public.intelligence_videntia_improvements
  for all to service_role using (true) with check (true);
create policy "videntia improvement events service role"
  on public.intelligence_videntia_improvement_events
  for all to service_role using (true) with check (true);

create or replace function private.guard_videntia_improvement_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'detected' then
      raise exception 'VIDENTIA improvement must start in detected state';
    end if;
    return new;
  end if;

  if new.user_id <> old.user_id or new.organization_id <> old.organization_id or new.candidate_key <> old.candidate_key then
    raise exception 'VIDENTIA improvement ownership and candidate key are immutable';
  end if;

  if new.status <> old.status then
    if not (
      (old.status = 'detected' and new.status = 'researching') or
      (old.status = 'researching' and new.status = 'proposed') or
      (old.status = 'proposed' and new.status = 'approved') or
      (old.status = 'approved' and new.status = 'implemented') or
      (old.status = 'implemented' and new.status = 'measured')
    ) then
      raise exception 'Invalid VIDENTIA improvement transition: % -> %', old.status, new.status;
    end if;
  end if;

  if new.human_decision_required is distinct from true or new.conviction_delta <> 0 then
    raise exception 'VIDENTIA improvement boundary cannot modify conviction or remove human decision';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger guard_videntia_improvement_transition
before insert or update on public.intelligence_videntia_improvements
for each row execute function private.guard_videntia_improvement_transition();

create or replace function private.log_videntia_improvement_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_name text;
begin
  if tg_op = 'INSERT' then
    event_name := 'detected';
  elsif new.status is distinct from old.status then
    event_name := 'status_transition';
  elsif new.result_snapshot is distinct from old.result_snapshot or new.measured_at is distinct from old.measured_at then
    event_name := 'measurement_recorded';
  elsif new.baseline_snapshot is distinct from old.baseline_snapshot or new.baseline_recorded_at is distinct from old.baseline_recorded_at then
    event_name := 'baseline_recorded';
  else
    event_name := 'content_refreshed';
  end if;

  insert into public.intelligence_videntia_improvement_events (
    improvement_id, user_id, organization_id, event_type, from_status, to_status, actor_id, note, snapshot
  ) values (
    new.id,
    new.user_id,
    new.organization_id,
    event_name,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status,
    new.last_actor_id,
    new.transition_note,
    jsonb_build_object(
      'candidate_key', new.candidate_key,
      'priority', new.priority,
      'confidence', new.confidence,
      'source_kind', new.source_kind,
      'baseline_recorded_at', new.baseline_recorded_at,
      'approved_at', new.approved_at,
      'implementation_ref', new.implementation_ref,
      'implemented_at', new.implemented_at,
      'measured_at', new.measured_at,
      'conviction_delta', new.conviction_delta,
      'human_decision_required', new.human_decision_required
    )
  );
  return new;
end;
$$;

create trigger log_videntia_improvement_event
after insert or update on public.intelligence_videntia_improvements
for each row execute function private.log_videntia_improvement_event();