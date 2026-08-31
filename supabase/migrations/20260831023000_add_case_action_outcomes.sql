alter table public.case_actions
  add column if not exists outcome text,
  add column if not exists outcome_at timestamptz,
  add column if not exists outcome_by uuid references auth.users(id) on delete set null;

alter table public.case_actions drop constraint if exists case_actions_outcome_len;
alter table public.case_actions add constraint case_actions_outcome_len
  check (outcome is null or char_length(trim(outcome)) between 2 and 2000);

create index if not exists case_actions_outcome_by_idx on public.case_actions(outcome_by)
  where outcome_by is not null;

create or replace function public.validate_case_action_outcome()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.status = 'done' then
    if nullif(trim(new.outcome), '') is null then raise exception 'action_outcome_required'; end if;
    new.outcome := trim(new.outcome);
    if old.status is distinct from new.status or old.outcome is distinct from new.outcome then
      new.completed_at := now();
      new.outcome_at := now();
      new.outcome_by := auth.uid();
    else
      new.completed_at := old.completed_at;
      new.outcome_at := old.outcome_at;
      new.outcome_by := old.outcome_by;
    end if;
  elsif new.status = 'open' then
    new.completed_at := null;
    new.outcome := null;
    new.outcome_at := null;
    new.outcome_by := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_case_action_outcome on public.case_actions;
create trigger trg_validate_case_action_outcome
before update of status, outcome on public.case_actions
for each row execute function public.validate_case_action_outcome();

create or replace function public.protect_case_action_update()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
  v_role := public.case_access_role(old.case_id,auth.uid());
  if v_role in ('owner','editor') then return new; end if;
  if old.assigned_to=auth.uid() then
    if new.case_id is distinct from old.case_id
      or new.title is distinct from old.title
      or new.assigned_to is distinct from old.assigned_to
      or new.created_by is distinct from old.created_by
      or new.due_at is distinct from old.due_at
      or new.created_at is distinct from old.created_at
      or new.completed_at is distinct from old.completed_at
      or new.outcome_at is distinct from old.outcome_at
      or new.outcome_by is distinct from old.outcome_by
    then raise exception 'assignee_can_only_change_status_and_outcome'; end if;
    return new;
  end if;
  raise exception 'not_allowed';
end $$;

drop trigger if exists trg_protect_case_action_update on public.case_actions;
create trigger trg_protect_case_action_update before update on public.case_actions for each row execute function public.protect_case_action_update();
