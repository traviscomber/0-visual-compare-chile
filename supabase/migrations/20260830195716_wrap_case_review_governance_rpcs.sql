create or replace function private.cancel_case_review(p_review_id uuid)
returns public.case_review_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_row public.case_review_requests;
begin
  update public.case_review_requests r
    set status='cancelled',updated_at=now()
    where r.id=p_review_id and r.status='pending'
      and (r.requested_by=auth.uid() or public.case_access_role(r.case_id,auth.uid())='owner')
    returning * into v_row;
  if v_row.id is null then raise exception 'not_allowed'; end if;
  return v_row;
end
$$;
revoke all on function private.cancel_case_review(uuid) from public;
grant execute on function private.cancel_case_review(uuid) to authenticated, service_role;

create or replace function public.cancel_case_review(p_review_id uuid)
returns public.case_review_requests
language plpgsql
security invoker
set search_path = public, private, auth
as $$
begin
  return private.cancel_case_review(p_review_id);
end
$$;

create or replace function private.respond_case_review(p_review_id uuid, p_decision text, p_note text default null)
returns public.case_review_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_row public.case_review_requests; v_status text;
begin
  v_status := case when p_decision='approved' then 'approved' when p_decision='changes_requested' then 'changes_requested' else null end;
  if v_status is null then raise exception 'invalid_decision'; end if;
  update public.case_review_requests
    set status=v_status,response_note=nullif(left(trim(coalesce(p_note,'')),2000),''),responded_at=now(),updated_at=now()
    where id=p_review_id and reviewer_id=auth.uid() and status='pending'
    returning * into v_row;
  if v_row.id is null then raise exception 'not_allowed'; end if;
  return v_row;
end
$$;
revoke all on function private.respond_case_review(uuid, text, text) from public;
grant execute on function private.respond_case_review(uuid, text, text) to authenticated, service_role;

create or replace function public.respond_case_review(p_review_id uuid, p_decision text, p_note text default null)
returns public.case_review_requests
language plpgsql
security invoker
set search_path = public, private, auth
as $$
begin
  return private.respond_case_review(p_review_id, p_decision, p_note);
end
$$;

create or replace function private.request_case_review(p_case_id uuid, p_reviewer_id uuid, p_message text default null)
returns public.case_review_requests
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_role text; v_reviewer_role text; v_row public.case_review_requests;
begin
  v_role := public.case_access_role(p_case_id, auth.uid());
  if v_role not in ('owner','editor') then raise exception 'not_allowed'; end if;
  if p_reviewer_id = auth.uid() then raise exception 'self_review_not_allowed'; end if;
  v_reviewer_role := private.case_access_role(p_case_id, p_reviewer_id);
  if v_reviewer_role is null then raise exception 'reviewer_not_member'; end if;
  insert into public.case_review_requests(case_id,requested_by,reviewer_id,message)
  values(p_case_id,auth.uid(),p_reviewer_id,nullif(left(trim(coalesce(p_message,'')),1000),''))
  returning * into v_row;
  return v_row;
end
$$;
revoke all on function private.request_case_review(uuid, uuid, text) from public;
grant execute on function private.request_case_review(uuid, uuid, text) to authenticated, service_role;

create or replace function public.request_case_review(p_case_id uuid, p_reviewer_id uuid, p_message text default null)
returns public.case_review_requests
language plpgsql
security invoker
set search_path = public, private, auth
as $$
begin
  return private.request_case_review(p_case_id, p_reviewer_id, p_message);
end
$$;

create or replace function private.set_case_governance(p_case_id uuid, p_required_approvals integer, p_review_deadline_days integer, p_block_on_changes boolean default true)
returns public.case_governance
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_row public.case_governance;
begin
  if public.case_access_role(p_case_id,auth.uid()) <> 'owner' then raise exception 'not_allowed'; end if;
  if p_required_approvals < 1 or p_required_approvals > 10 then raise exception 'invalid_required_approvals'; end if;
  if p_review_deadline_days < 1 or p_review_deadline_days > 30 then raise exception 'invalid_deadline'; end if;
  insert into public.case_governance(case_id,required_approvals,review_deadline_days,block_on_changes,updated_by,updated_at)
  values(p_case_id,p_required_approvals,p_review_deadline_days,coalesce(p_block_on_changes,true),auth.uid(),now())
  on conflict(case_id) do update set required_approvals=excluded.required_approvals,review_deadline_days=excluded.review_deadline_days,block_on_changes=excluded.block_on_changes,updated_by=auth.uid(),updated_at=now()
  returning * into v_row;
  return v_row;
end
$$;
revoke all on function private.set_case_governance(uuid, integer, integer, boolean) from public;
grant execute on function private.set_case_governance(uuid, integer, integer, boolean) to authenticated, service_role;

create or replace function public.set_case_governance(p_case_id uuid, p_required_approvals integer, p_review_deadline_days integer, p_block_on_changes boolean default true)
returns public.case_governance
language plpgsql
security invoker
set search_path = public, private, auth
as $$
begin
  return private.set_case_governance(p_case_id, p_required_approvals, p_review_deadline_days, p_block_on_changes);
end
$$;

create or replace function private.start_case_approval_round(p_case_id uuid, p_reviewer_ids uuid[], p_message text default null)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_role text; v_required integer; v_days integer; v_round uuid:=gen_random_uuid(); v_reviewer uuid; v_distinct_count integer;
begin
  v_role:=public.case_access_role(p_case_id,auth.uid());
  if v_role not in ('owner','editor') then raise exception 'not_allowed'; end if;
  select coalesce(g.required_approvals,1),coalesce(g.review_deadline_days,3) into v_required,v_days from public.case_governance g where g.case_id=p_case_id;
  if not found then v_required:=1;v_days:=3; end if;
  select count(distinct x) into v_distinct_count from unnest(coalesce(p_reviewer_ids,'{}'::uuid[])) x;
  if v_distinct_count < v_required then raise exception 'insufficient_reviewers'; end if;
  if exists(select 1 from public.case_review_requests r where r.case_id=p_case_id and r.governance_round_id is not null and r.status='pending') then raise exception 'round_in_progress'; end if;
  foreach v_reviewer in array p_reviewer_ids loop
    if v_reviewer=auth.uid() then raise exception 'self_review_not_allowed'; end if;
    if private.case_access_role(p_case_id,v_reviewer) is null then raise exception 'reviewer_not_member'; end if;
  end loop;
  insert into public.case_governance(case_id,required_approvals,review_deadline_days,block_on_changes,current_round_id,round_started_at,round_deadline_at,updated_by,updated_at)
  values(p_case_id,v_required,v_days,true,v_round,now(),now()+make_interval(days=>v_days),auth.uid(),now())
  on conflict(case_id) do update set current_round_id=v_round,round_started_at=now(),round_deadline_at=now()+make_interval(days=>public.case_governance.review_deadline_days),updated_by=auth.uid(),updated_at=now();
  insert into public.case_review_requests(case_id,requested_by,reviewer_id,message,governance_round_id,deadline_at)
  select p_case_id,auth.uid(),x,nullif(left(trim(coalesce(p_message,'')),1000),''),v_round,(select round_deadline_at from public.case_governance where case_id=p_case_id)
  from (select distinct unnest(p_reviewer_ids) as x) s;
  return v_round;
end
$$;
revoke all on function private.start_case_approval_round(uuid, uuid[], text) from public;
grant execute on function private.start_case_approval_round(uuid, uuid[], text) to authenticated, service_role;

create or replace function public.start_case_approval_round(p_case_id uuid, p_reviewer_ids uuid[], p_message text default null)
returns uuid
language sql
security invoker
set search_path = public, private, auth
as $$
  select private.start_case_approval_round(p_case_id, p_reviewer_ids, p_message)
$$;

create or replace function private.extend_case_review_deadline(p_case_id uuid, p_days integer default 2)
returns timestamptz
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_round uuid;
  v_deadline timestamptz;
  v_days integer := greatest(1, least(coalesce(p_days,2),14));
begin
  v_role := public.case_access_role(p_case_id, auth.uid());
  if v_role <> 'owner' then raise exception 'not_allowed'; end if;
  select current_round_id, round_deadline_at into v_round, v_deadline from public.case_governance where case_id = p_case_id for update;
  if v_round is null or v_deadline is null then raise exception 'no_active_round'; end if;
  v_deadline := greatest(v_deadline, now()) + make_interval(days => v_days);
  update public.case_governance set round_deadline_at = v_deadline, updated_by = auth.uid(), updated_at = now() where case_id = p_case_id;
  update public.case_review_requests set deadline_at = v_deadline, updated_at = now() where case_id = p_case_id and governance_round_id = v_round and status = 'pending';
  insert into public.user_notifications(user_id,actor_id,case_id,kind,title,body,href,created_at)
  select distinct r.reviewer_id, auth.uid(), p_case_id, 'review_deadline_extended', 'Deadline de revisión actualizado', 'El plazo de esta revisión fue extendido.', '/casos/' || p_case_id::text || '/revision', now()
  from public.case_review_requests r where r.case_id = p_case_id and r.governance_round_id = v_round and r.status = 'pending';
  insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at)
  values (p_case_id, auth.uid(), 'review_deadline_extended', 'Deadline de revisión extendido', jsonb_build_object('days_added', v_days, 'deadline_at', v_deadline), now());
  return v_deadline;
end
$$;
revoke all on function private.extend_case_review_deadline(uuid, integer) from public;
grant execute on function private.extend_case_review_deadline(uuid, integer) to authenticated, service_role;

create or replace function public.extend_case_review_deadline(p_case_id uuid, p_days integer default 2)
returns timestamptz
language sql
security invoker
set search_path = public, private, auth
as $$
  select private.extend_case_review_deadline(p_case_id, p_days)
$$;

create or replace function private.remind_case_reviewers(p_case_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth
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
  select r.reviewer_id, auth.uid(), p_case_id, 'review_reminder', 'Revisión pendiente', 'Hay una revisión pendiente que requiere tu respuesta.', '/casos/' || p_case_id::text || '/revision', now()
  from public.case_review_requests r
  where r.case_id = p_case_id and r.governance_round_id = v_round and r.status = 'pending'
    and not exists (select 1 from public.user_notifications n where n.user_id = r.reviewer_id and n.case_id = p_case_id and n.kind = 'review_reminder' and n.created_at > now() - interval '12 hours');
  get diagnostics v_count = row_count;
  insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at)
  values (p_case_id, auth.uid(), 'review_reminder_sent', 'Recordatorio de revisión enviado', jsonb_build_object('notified_reviewers', v_count), now());
  return v_count;
end
$$;
revoke all on function private.remind_case_reviewers(uuid) from public;
grant execute on function private.remind_case_reviewers(uuid) to authenticated, service_role;

create or replace function public.remind_case_reviewers(p_case_id uuid)
returns integer
language sql
security invoker
set search_path = public, private, auth
as $$
  select private.remind_case_reviewers(p_case_id)
$$;
