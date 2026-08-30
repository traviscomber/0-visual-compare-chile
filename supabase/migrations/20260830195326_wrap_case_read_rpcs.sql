create or replace function private.get_case_members(p_case_id uuid)
returns table(user_id uuid, email text, display_name text, role text, is_owner boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if public.case_access_role(p_case_id, auth.uid()) is null then
    raise exception 'not_allowed';
  end if;

  return query
  select
    cm.user_id,
    u.email::text,
    coalesce(
      p.full_name,
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    )::text as display_name,
    cm.role,
    (cm.role = 'owner') as is_owner
  from public.case_members cm
  join auth.users u on u.id = cm.user_id
  left join public.profiles p on p.id = cm.user_id
  where cm.case_id = p_case_id
  order by
    case cm.role when 'owner' then 0 when 'editor' then 1 else 2 end,
    coalesce(p.full_name, u.email);
end
$$;
revoke all on function private.get_case_members(uuid) from public;
grant execute on function private.get_case_members(uuid) to authenticated, service_role;

create or replace function public.get_case_members(p_case_id uuid)
returns table(user_id uuid, email text, display_name text, role text, is_owner boolean)
language sql
security invoker
set search_path = public, private, auth
as $$
  select * from private.get_case_members(p_case_id)
$$;

create or replace function private.get_case_members_batch(p_case_ids uuid[])
returns table(case_id uuid, user_id uuid, email text, display_name text, role text, is_owner boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if p_case_ids is null or cardinality(p_case_ids) = 0 then
    return;
  end if;

  if cardinality(p_case_ids) > 100 then
    raise exception 'too_many_cases';
  end if;

  if exists (
    select 1
    from unnest(p_case_ids) as requested(case_id)
    where public.case_access_role(requested.case_id, auth.uid()) is null
  ) then
    raise exception 'not_allowed';
  end if;

  return query
  select
    cm.case_id,
    cm.user_id,
    u.email::text,
    coalesce(p.full_name, u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))::text,
    cm.role,
    (cm.role = 'owner')
  from public.case_members cm
  join auth.users u on u.id = cm.user_id
  left join public.profiles p on p.id = cm.user_id
  where cm.case_id = any(p_case_ids)
  order by cm.case_id,
    case cm.role when 'owner' then 0 when 'editor' then 1 else 2 end,
    coalesce(p.full_name, u.email);
end
$$;
revoke all on function private.get_case_members_batch(uuid[]) from public;
grant execute on function private.get_case_members_batch(uuid[]) to authenticated, service_role;

create or replace function public.get_case_members_batch(p_case_ids uuid[])
returns table(case_id uuid, user_id uuid, email text, display_name text, role text, is_owner boolean)
language sql
security invoker
set search_path = public, private, auth
as $$
  select * from private.get_case_members_batch(p_case_ids)
$$;

create or replace function private.get_case_governance_status(p_case_id uuid)
returns table(state text, required_approvals integer, approved_count integer, pending_count integer, changes_count integer, total_reviewers integer, deadline_at timestamptz, waiting_on uuid[])
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare v_round uuid; v_required integer; v_deadline timestamptz; v_block boolean;
begin
  if public.case_access_role(p_case_id,auth.uid()) is null then raise exception 'not_allowed'; end if;
  select g.current_round_id,g.required_approvals,g.round_deadline_at,g.block_on_changes into v_round,v_required,v_deadline,v_block from public.case_governance g where g.case_id=p_case_id;
  if v_required is null then v_required:=1; end if;
  return query
  with r as (
    select * from public.case_review_requests where case_id=p_case_id and governance_round_id=v_round
  ), agg as (
    select count(*) filter(where status='approved')::int a,count(*) filter(where status='pending')::int p,count(*) filter(where status='changes_requested')::int c,count(*)::int t,array_agg(reviewer_id) filter(where status='pending') w from r
  )
  select case
    when v_round is null then 'ready_for_approval'
    when coalesce(agg.c,0)>0 and coalesce(v_block,true) then 'blocked'
    when coalesce(agg.a,0)>=v_required then 'approved'
    when v_deadline is not null and v_deadline<now() and coalesce(agg.p,0)>0 then 'overdue'
    else 'waiting'
  end,
  v_required,coalesce(agg.a,0),coalesce(agg.p,0),coalesce(agg.c,0),coalesce(agg.t,0),v_deadline,coalesce(agg.w,'{}'::uuid[])
  from agg;
end
$$;
revoke all on function private.get_case_governance_status(uuid) from public;
grant execute on function private.get_case_governance_status(uuid) to authenticated, service_role;

create or replace function public.get_case_governance_status(p_case_id uuid)
returns table(state text, required_approvals integer, approved_count integer, pending_count integer, changes_count integer, total_reviewers integer, deadline_at timestamptz, waiting_on uuid[])
language sql
stable
security invoker
set search_path = public, private, auth
as $$
  select * from private.get_case_governance_status(p_case_id)
$$;
