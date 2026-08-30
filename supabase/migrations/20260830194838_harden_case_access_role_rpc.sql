create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.case_access_role(p_case_id uuid, p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when c.user_id = p_user_id then 'owner'
    else (
      select cm.role
      from public.case_members cm
      where cm.case_id = c.id and cm.user_id = p_user_id
      limit 1
    )
  end
  from public.cases c
  where c.id = p_case_id
$$;

revoke all on function private.case_access_role(uuid, uuid) from public;
grant execute on function private.case_access_role(uuid, uuid) to authenticated, service_role;

create or replace function public.case_access_role(p_case_id uuid, p_user_id uuid default auth.uid())
returns text
language plpgsql
stable
security invoker
set search_path = public, private, auth
as $$
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'not_allowed';
  end if;
  return private.case_access_role(p_case_id, p_user_id);
end;
$$;

create or replace function public.request_case_review(p_case_id uuid, p_reviewer_id uuid, p_message text default null)
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

create or replace function public.start_case_approval_round(p_case_id uuid, p_reviewer_ids uuid[], p_message text default null)
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
