create or replace function public.validate_case_collaboration_targets()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_user uuid;
begin
  if tg_table_name = 'case_comments' then
    foreach target_user in array coalesce(new.mentions, '{}'::uuid[]) loop
      if public.case_access_role(new.case_id, target_user) is null then
        raise exception using
          errcode = '22023',
          message = 'case_mention_target_not_member';
      end if;
    end loop;
  elsif tg_table_name = 'case_actions' then
    if new.assigned_to is not null
       and public.case_access_role(new.case_id, new.assigned_to) is null then
      raise exception using
        errcode = '22023',
        message = 'case_action_assignee_not_member';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_case_comment_targets on public.case_comments;
create trigger trg_validate_case_comment_targets
before insert or update of case_id, mentions on public.case_comments
for each row execute function public.validate_case_collaboration_targets();

drop trigger if exists trg_validate_case_action_targets on public.case_actions;
create trigger trg_validate_case_action_targets
before insert or update of case_id, assigned_to on public.case_actions
for each row execute function public.validate_case_collaboration_targets();
