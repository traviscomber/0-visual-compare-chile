-- Prevent case collaboration notifications from targeting users outside the case.
-- The API validates this too, but the database remains authoritative for direct PostgREST access.

create or replace function public.enforce_case_collaboration_recipient_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid;
begin
  if tg_table_name = 'case_comments' then
    foreach v_uid in array new.mentions loop
      if not exists (
        select 1
        from public.case_members cm
        where cm.case_id = new.case_id
          and cm.user_id = v_uid
      ) then
        raise exception 'case_recipient_not_member' using errcode = '23514';
      end if;
    end loop;
  elsif tg_table_name = 'case_actions' and new.assigned_to is not null then
    if not exists (
      select 1
      from public.case_members cm
      where cm.case_id = new.case_id
        and cm.user_id = new.assigned_to
    ) then
      raise exception 'case_recipient_not_member' using errcode = '23514';
    end if;
  end if;

  return new;
end
$function$;

revoke all on function public.enforce_case_collaboration_recipient_scope() from public;
revoke all on function public.enforce_case_collaboration_recipient_scope() from anon;
revoke all on function public.enforce_case_collaboration_recipient_scope() from authenticated;
grant execute on function public.enforce_case_collaboration_recipient_scope() to service_role;

drop trigger if exists trg_case_comment_recipient_scope on public.case_comments;
create trigger trg_case_comment_recipient_scope
before insert or update of case_id, mentions on public.case_comments
for each row execute function public.enforce_case_collaboration_recipient_scope();

drop trigger if exists trg_case_action_recipient_scope on public.case_actions;
create trigger trg_case_action_recipient_scope
before insert or update of case_id, assigned_to on public.case_actions
for each row execute function public.enforce_case_collaboration_recipient_scope();

create or replace function public.notify_case_collaboration()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_case_title text;
  v_uid uuid;
begin
  select title into v_case_title from public.cases where id = new.case_id;

  if tg_table_name = 'case_comments' then
    foreach v_uid in array new.mentions loop
      if v_uid <> new.author_id
        and exists (
          select 1
          from public.case_members cm
          where cm.case_id = new.case_id
            and cm.user_id = v_uid
        )
      then
        insert into public.user_notifications(user_id, actor_id, case_id, kind, title, body, href)
        values(v_uid, new.author_id, new.case_id, 'mention', 'Te mencionaron en un caso', left(new.body, 240), '/casos/' || new.case_id || '/equipo');
      end if;
    end loop;
  elsif tg_table_name = 'case_actions' and new.assigned_to is not null then
    if (tg_op = 'INSERT' or old.assigned_to is distinct from new.assigned_to)
      and exists (
        select 1
        from public.case_members cm
        where cm.case_id = new.case_id
          and cm.user_id = new.assigned_to
      )
    then
      insert into public.user_notifications(user_id, actor_id, case_id, kind, title, body, href)
      values(new.assigned_to, new.created_by, new.case_id, 'action_assigned', 'Nueva acción asignada', new.title, '/casos/' || new.case_id || '/equipo');
    end if;
  end if;

  return new;
end
$function$;
