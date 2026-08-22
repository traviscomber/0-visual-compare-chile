create or replace function public.protect_case_owner()
returns trigger language plpgsql set search_path=public as $$
begin
  if old.user_id is distinct from new.user_id then raise exception 'case_owner_immutable'; end if;
  return new;
end $$;
drop trigger if exists trg_protect_case_owner on public.cases;
create trigger trg_protect_case_owner before update on public.cases for each row execute function public.protect_case_owner();

create or replace function public.protect_case_action_update()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
  v_role := public.case_access_role(old.case_id,auth.uid());
  if v_role in ('owner','editor') then return new; end if;
  if old.assigned_to=auth.uid() then
    if new.case_id is distinct from old.case_id or new.title is distinct from old.title or new.assigned_to is distinct from old.assigned_to or new.created_by is distinct from old.created_by or new.due_at is distinct from old.due_at or new.created_at is distinct from old.created_at then raise exception 'assignee_can_only_change_status'; end if;
    return new;
  end if;
  raise exception 'not_allowed';
end $$;
drop trigger if exists trg_protect_case_action_update on public.case_actions;
create trigger trg_protect_case_action_update before update on public.case_actions for each row execute function public.protect_case_action_update();
