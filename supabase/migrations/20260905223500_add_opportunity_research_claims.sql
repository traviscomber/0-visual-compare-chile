begin;

alter table public.innovation_opportunity_theses
  add column if not exists research_claimed_at timestamptz,
  add column if not exists research_claim_token uuid;

create index if not exists innovation_opportunity_theses_research_queue_idx
  on public.innovation_opportunity_theses (last_researched_at nulls first, overall_score desc, created_at)
  where status in ('exploring','watching','prototype');

create or replace function public.claim_innovation_opportunity_theses(p_limit integer default 4)
returns setof public.innovation_opportunity_theses
language plpgsql
set search_path = public
as $$
begin
  return query
  with candidates as (
    select t.id
    from public.innovation_opportunity_theses t
    where t.status in ('exploring','watching','prototype')
      and (t.last_researched_at is null or t.last_researched_at <= now() - interval '20 hours')
      and (t.research_claimed_at is null or t.research_claimed_at <= now() - interval '30 minutes')
    order by t.last_researched_at nulls first, t.overall_score desc, t.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 4), 4))
  )
  update public.innovation_opportunity_theses t
  set research_claimed_at = now(),
      research_claim_token = gen_random_uuid()
  from candidates c
  where t.id = c.id
  returning t.*;
end;
$$;

revoke all on function public.claim_innovation_opportunity_theses(integer) from public, anon, authenticated;
grant execute on function public.claim_innovation_opportunity_theses(integer) to service_role;

comment on column public.innovation_opportunity_theses.research_claimed_at is
  'Transient scheduler claim timestamp. Stale claims become eligible again after 30 minutes.';
comment on column public.innovation_opportunity_theses.research_claim_token is
  'Transient exact-row claim token used to prevent overlapping scheduled conviction research.';
comment on function public.claim_innovation_opportunity_theses(integer) is
  'Atomically claims up to four active opportunity theses due for conviction research using FOR UPDATE SKIP LOCKED.';

commit;
