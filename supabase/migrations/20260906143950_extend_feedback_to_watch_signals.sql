alter table public.intelligence_feedback drop constraint if exists intelligence_feedback_target_type_check;
alter table public.intelligence_feedback add constraint intelligence_feedback_target_type_check check (target_type in ('strategic_watch_event','watch_signal'));

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
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_existing public.intelligence_feedback%rowtype;
  v_feedback_id uuid;
  v_key text := trim(p_target_key);
  v_kind text;
  v_id uuid;
begin
  if p_user_id is null then raise exception 'user_id_required'; end if;
  if p_target_type not in ('strategic_watch_event','watch_signal') then raise exception 'unsupported_target_type'; end if;
  if p_feedback_type not in ('relevant','irrelevant','false_match','identity_incorrect') then raise exception 'invalid_feedback_type'; end if;
  if nullif(v_key, '') is null or char_length(v_key) > 300 then raise exception 'invalid_target_key'; end if;

  if p_target_type = 'strategic_watch_event' then
    if not exists (select 1 from public.intelligence_watch_events e where e.id::text = v_key and e.user_id = p_user_id) then raise exception 'target_not_found'; end if;
  else
    v_kind := split_part(v_key, ':', 1);
    begin
      v_id := split_part(v_key, ':', 2)::uuid;
    exception when others then
      raise exception 'target_not_found';
    end;
    if v_kind = 'brand' then
      if not exists (select 1 from public.trademark_watch_signal_events e where e.id = v_id and e.user_id = p_user_id) then raise exception 'target_not_found'; end if;
    elsif v_kind = 'patent' then
      if not exists (select 1 from public.patent_alert_events e where e.id = v_id and e.user_id = p_user_id) then raise exception 'target_not_found'; end if;
    elsif v_kind = 'technology' then
      if not exists (select 1 from public.intelligence_watch_events e where e.id = v_id and e.user_id = p_user_id) then raise exception 'target_not_found'; end if;
    else
      raise exception 'target_not_found';
    end if;
  end if;

  select * into v_existing
  from public.intelligence_feedback f
  where f.user_id = p_user_id and f.target_type = p_target_type and f.target_key = v_key
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
      v_feedback_id,p_user_id,p_target_type,v_key,'updated',v_existing.feedback_type,p_feedback_type,nullif(trim(p_note),''),coalesce(p_metadata,'{}'::jsonb)
    );
  else
    insert into public.intelligence_feedback (
      user_id,target_type,target_key,feedback_type,note,metadata
    ) values (
      p_user_id,p_target_type,v_key,p_feedback_type,nullif(trim(p_note),''),coalesce(p_metadata,'{}'::jsonb)
    ) returning id into v_feedback_id;

    insert into public.intelligence_feedback_audit (
      feedback_id,user_id,target_type,target_key,action,feedback_type,note,metadata
    ) values (
      v_feedback_id,p_user_id,p_target_type,v_key,'created',p_feedback_type,nullif(trim(p_note),''),coalesce(p_metadata,'{}'::jsonb)
    );
  end if;

  return v_feedback_id;
end;
$function$;