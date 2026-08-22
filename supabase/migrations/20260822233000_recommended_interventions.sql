create or replace function public.remind_case_reviewers(p_case_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_role text;
  v_round uuid;
  v_count integer := 0;
begin
  v_role := public.case_access_role(p_case_id, auth.uid());
  if v_role not in ('owner','editor') then raise exception 'not_allowed'; end if;

  select current_round_id into v_round from public.case_governance where case_id = p_case_id;
  if v_round is null then raise exception 'no_active_round'; end if;

  insert into public.user_notifications(user_id,actor_id,case_id,kind,title,body,href,created_at)
  select r.reviewer_id, auth.uid(), p_case_id, 'review_reminder', 'Revisión pendiente',
         'Hay una revisión pendiente que requiere tu respuesta.',
         '/casos/' || p_case_id::text || '/revision', now()
  from public.case_review_requests r
  where r.case_id = p_case_id
    and r.governance_round_id = v_round
    and r.status = 'pending'
    and not exists (
      select 1 from public.user_notifications n
      where n.user_id = r.reviewer_id
        and n.case_id = p_case_id
        and n.kind = 'review_reminder'
        and n.created_at > now() - interval '12 hours'
    );

  get diagnostics v_count = row_count;
  insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at)
  values (p_case_id, auth.uid(), 'review_reminder_sent', 'Recordatorio de revisión enviado', jsonb_build_object('notified_reviewers', v_count), now());
  return v_count;
end;
$$;

create or replace function public.extend_case_review_deadline(p_case_id uuid, p_days integer default 2)
returns timestamptz
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_role text;
  v_round uuid;
  v_deadline timestamptz;
  v_days integer := greatest(1, least(coalesce(p_days,2),14));
begin
  v_role := public.case_access_role(p_case_id, auth.uid());
  if v_role <> 'owner' then raise exception 'not_allowed'; end if;

  select current_round_id, round_deadline_at into v_round, v_deadline
  from public.case_governance where case_id = p_case_id for update;
  if v_round is null or v_deadline is null then raise exception 'no_active_round'; end if;

  v_deadline := greatest(v_deadline, now()) + make_interval(days => v_days);
  update public.case_governance set round_deadline_at = v_deadline, updated_by = auth.uid(), updated_at = now() where case_id = p_case_id;
  update public.case_review_requests set deadline_at = v_deadline, updated_at = now() where case_id = p_case_id and governance_round_id = v_round and status = 'pending';

  insert into public.user_notifications(user_id,actor_id,case_id,kind,title,body,href,created_at)
  select distinct r.reviewer_id, auth.uid(), p_case_id, 'review_deadline_extended', 'Deadline de revisión actualizado',
         'El plazo de esta revisión fue extendido.', '/casos/' || p_case_id::text || '/revision', now()
  from public.case_review_requests r
  where r.case_id = p_case_id and r.governance_round_id = v_round and r.status = 'pending';

  insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at)
  values (p_case_id, auth.uid(), 'review_deadline_extended', 'Deadline de revisión extendido', jsonb_build_object('days_added', v_days, 'deadline_at', v_deadline), now());
  return v_deadline;
end;
$$;

revoke all on function public.remind_case_reviewers(uuid) from public, anon;
revoke all on function public.extend_case_review_deadline(uuid,integer) from public, anon;
grant execute on function public.remind_case_reviewers(uuid) to authenticated;
grant execute on function public.extend_case_review_deadline(uuid,integer) to authenticated;
