create table if not exists public.case_governance (
  case_id uuid primary key references public.cases(id) on delete cascade,
  required_approvals integer not null default 1 check (required_approvals between 1 and 10),
  review_deadline_days integer not null default 3 check (review_deadline_days between 1 and 30),
  block_on_changes boolean not null default true,
  current_round_id uuid,
  round_started_at timestamptz,
  round_deadline_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.case_review_requests add column if not exists governance_round_id uuid;
alter table public.case_review_requests add column if not exists deadline_at timestamptz;
create index if not exists case_reviews_round_idx on public.case_review_requests(case_id,governance_round_id,status);

alter table public.case_governance enable row level security;
drop policy if exists case_governance_select_accessible on public.case_governance;
create policy case_governance_select_accessible on public.case_governance for select to authenticated using(public.case_access_role(case_id,auth.uid()) is not null);
revoke insert,update,delete on public.case_governance from authenticated, anon;
grant select on public.case_governance to authenticated;

create or replace function public.set_case_governance(p_case_id uuid,p_required_approvals integer,p_review_deadline_days integer,p_block_on_changes boolean default true)
returns public.case_governance language plpgsql security definer set search_path=public,auth as $$
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
end $$;
revoke all on function public.set_case_governance(uuid,integer,integer,boolean) from public;
grant execute on function public.set_case_governance(uuid,integer,integer,boolean) to authenticated;

create or replace function public.start_case_approval_round(p_case_id uuid,p_reviewer_ids uuid[],p_message text default null)
returns uuid language plpgsql security definer set search_path=public,auth as $$
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
    if public.case_access_role(p_case_id,v_reviewer) is null then raise exception 'reviewer_not_member'; end if;
  end loop;
  insert into public.case_governance(case_id,required_approvals,review_deadline_days,block_on_changes,current_round_id,round_started_at,round_deadline_at,updated_by,updated_at)
  values(p_case_id,v_required,v_days,true,v_round,now(),now()+make_interval(days=>v_days),auth.uid(),now())
  on conflict(case_id) do update set current_round_id=v_round,round_started_at=now(),round_deadline_at=now()+make_interval(days=>public.case_governance.review_deadline_days),updated_by=auth.uid(),updated_at=now();
  insert into public.case_review_requests(case_id,requested_by,reviewer_id,message,governance_round_id,deadline_at)
  select p_case_id,auth.uid(),x,nullif(left(trim(coalesce(p_message,'')),1000),''),v_round,(select round_deadline_at from public.case_governance where case_id=p_case_id)
  from (select distinct unnest(p_reviewer_ids) as x) s;
  return v_round;
end $$;
revoke all on function public.start_case_approval_round(uuid,uuid[],text) from public;
grant execute on function public.start_case_approval_round(uuid,uuid[],text) to authenticated;

create or replace function public.get_case_governance_status(p_case_id uuid)
returns table(state text,required_approvals integer,approved_count integer,pending_count integer,changes_count integer,total_reviewers integer,deadline_at timestamptz,waiting_on uuid[]) language plpgsql stable security definer set search_path=public,auth as $$
declare v_round uuid; v_required integer; v_deadline timestamptz; v_block boolean;
begin
  if public.case_access_role(p_case_id,auth.uid()) is null then raise exception 'not_allowed'; end if;
  select g.current_round_id,g.required_approvals,g.round_deadline_at,g.block_on_changes into v_round,v_required,v_deadline,v_block from public.case_governance g where g.case_id=p_case_id;
  if v_required is null then v_required:=1; end if;
  return query with r as (select * from public.case_review_requests where case_id=p_case_id and governance_round_id=v_round), agg as (
    select count(*) filter(where status='approved')::int a,count(*) filter(where status='pending')::int p,count(*) filter(where status='changes_requested')::int c,count(*)::int t,array_agg(reviewer_id) filter(where status='pending') w from r)
  select case when v_round is null then 'ready_for_approval' when coalesce(agg.c,0)>0 and coalesce(v_block,true) then 'blocked' when coalesce(agg.a,0)>=v_required then 'approved' when v_deadline is not null and v_deadline<now() and coalesce(agg.p,0)>0 then 'overdue' else 'waiting' end,
  v_required,coalesce(agg.a,0),coalesce(agg.p,0),coalesce(agg.c,0),coalesce(agg.t,0),v_deadline,coalesce(agg.w,'{}'::uuid[]) from agg;
end $$;
revoke all on function public.get_case_governance_status(uuid) from public;
grant execute on function public.get_case_governance_status(uuid) to authenticated;
