revoke all on function public.submit_intelligence_feedback(text,text,text,text,jsonb) from public, anon, authenticated, service_role;
revoke all on function public.delete_intelligence_feedback(uuid) from public, anon, authenticated, service_role;
drop function public.submit_intelligence_feedback(text,text,text,text,jsonb);
drop function public.delete_intelligence_feedback(uuid);

create or replace function public.submit_intelligence_feedback(
  p_user_id uuid,
  p_target_type text,
  p_target_key text,
  p_feedback_type text,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_existing public.intelligence_feedback%rowtype;
  v_feedback_id uuid;
begin
  if p_user_id is null then
    raise exception 'user_id_required';
  end if;
  if p_target_type <> 'strategic_watch_event' then
    raise exception 'unsupported_target_type';
  end if;
  if p_feedback_type not in ('relevant','irrelevant','false_match','identity_incorrect') then
    raise exception 'invalid_feedback_type';
  end if;
  if nullif(trim(p_target_key), '') is null or char_length(trim(p_target_key)) > 300 then
    raise exception 'invalid_target_key';
  end if;
  if not exists (
    select 1
    from public.intelligence_watch_events e
    where e.id::text = trim(p_target_key)
      and e.user_id = p_user_id
  ) then
    raise exception 'target_not_found';
  end if;

  select * into v_existing
  from public.intelligence_feedback f
  where f.user_id = p_user_id
    and f.target_type = p_target_type
    and f.target_key = trim(p_target_key)
  for update;

  if found then
    update public.intelligence_feedback
    set feedback_type = p_feedback_type,
        note = nullif(trim(p_note), ''),
        metadata = coalesce(p_metadata, '{}'::jsonb),
        updated_at = now()
    where id = v_existing.id
    returning id into v_feedback_id;

    insert into public.intelligence_feedback_audit (
      feedback_id,user_id,target_type,target_key,action,previous_feedback_type,feedback_type,note,metadata
    ) values (
      v_feedback_id,p_user_id,p_target_type,trim(p_target_key),'updated',v_existing.feedback_type,p_feedback_type,nullif(trim(p_note),''),coalesce(p_metadata,'{}'::jsonb)
    );
  else
    insert into public.intelligence_feedback (
      user_id,target_type,target_key,feedback_type,note,metadata
    ) values (
      p_user_id,p_target_type,trim(p_target_key),p_feedback_type,nullif(trim(p_note),''),coalesce(p_metadata,'{}'::jsonb)
    ) returning id into v_feedback_id;

    insert into public.intelligence_feedback_audit (
      feedback_id,user_id,target_type,target_key,action,feedback_type,note,metadata
    ) values (
      v_feedback_id,p_user_id,p_target_type,trim(p_target_key),'created',p_feedback_type,nullif(trim(p_note),''),coalesce(p_metadata,'{}'::jsonb)
    );
  end if;

  return v_feedback_id;
end;
$$;

revoke all on function public.submit_intelligence_feedback(uuid,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.submit_intelligence_feedback(uuid,text,text,text,text,jsonb) to service_role;

create or replace function public.delete_intelligence_feedback(p_user_id uuid, p_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_existing public.intelligence_feedback%rowtype;
begin
  if p_user_id is null then
    raise exception 'user_id_required';
  end if;

  select * into v_existing
  from public.intelligence_feedback f
  where f.id = p_id and f.user_id = p_user_id
  for update;
  if not found then
    return false;
  end if;

  insert into public.intelligence_feedback_audit (
    feedback_id,user_id,target_type,target_key,action,previous_feedback_type,note,metadata
  ) values (
    v_existing.id,p_user_id,v_existing.target_type,v_existing.target_key,'deleted',v_existing.feedback_type,v_existing.note,v_existing.metadata
  );

  delete from public.intelligence_feedback where id = v_existing.id;
  return true;
end;
$$;

revoke all on function public.delete_intelligence_feedback(uuid,uuid) from public, anon, authenticated;
grant execute on function public.delete_intelligence_feedback(uuid,uuid) to service_role;
