create table public.intelligence_portfolio_bindings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  identity_id uuid not null references public.intelligence_company_identities(id) on delete restrict,
  is_primary boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, identity_id)
);

create unique index intelligence_portfolio_bindings_primary_org_idx
  on public.intelligence_portfolio_bindings (organization_id)
  where is_primary;
create index intelligence_portfolio_bindings_identity_idx
  on public.intelligence_portfolio_bindings (identity_id);
create index intelligence_portfolio_bindings_created_by_idx
  on public.intelligence_portfolio_bindings (created_by);

alter table public.intelligence_portfolio_bindings enable row level security;
revoke all on table public.intelligence_portfolio_bindings from anon, authenticated;
grant select, insert, update, delete on table public.intelligence_portfolio_bindings to service_role;
create policy intelligence_portfolio_bindings_service_role
  on public.intelligence_portfolio_bindings
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists intelligence_company_ip_activity_type_filing_idx
  on public.intelligence_company_ip_activity (entity_type, filing_date desc)
  where filing_date is not null;

create or replace function public.set_intelligence_portfolio_binding(
  p_organization_id uuid,
  p_identity_id uuid,
  p_created_by uuid
) returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  update public.intelligence_portfolio_bindings
     set is_primary = false,
         updated_at = now()
   where organization_id = p_organization_id
     and is_primary;

  insert into public.intelligence_portfolio_bindings (
    organization_id, identity_id, is_primary, created_by
  ) values (
    p_organization_id, p_identity_id, true, p_created_by
  )
  on conflict (organization_id, identity_id)
  do update set
    is_primary = true,
    created_by = excluded.created_by,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;
revoke execute on function public.set_intelligence_portfolio_binding(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.set_intelligence_portfolio_binding(uuid, uuid, uuid) to service_role;

create or replace function public.analyze_ip_space(
  p_entity_type text,
  p_code text,
  p_window_days integer default 180
) returns table (
  identity_id uuid,
  canonical_name text,
  country text,
  current_count bigint,
  previous_count bigint,
  delta bigint,
  movement text,
  latest_filing date
)
language sql
stable
set search_path = public, pg_temp
as $$
  with counts as (
    select
      a.identity_id,
      count(*) filter (where a.filing_date >= current_date - p_window_days) as current_count,
      count(*) filter (
        where a.filing_date < current_date - p_window_days
          and a.filing_date >= current_date - (p_window_days * 2)
      ) as previous_count,
      max(a.filing_date) as latest_filing
    from public.intelligence_company_ip_activity a
    where p_entity_type in ('patent', 'trademark')
      and p_window_days between 30 and 365
      and length(btrim(p_code)) between 1 and 32
      and a.entity_type = p_entity_type
      and a.filing_date >= current_date - (p_window_days * 2)
      and a.classification_codes @> array[p_code]::text[]
    group by a.identity_id
  )
  select
    c.identity_id,
    i.canonical_name,
    i.country,
    c.current_count,
    c.previous_count,
    c.current_count - c.previous_count as delta,
    case
      when c.current_count >= 2 and c.previous_count = 0 then 'entrante'
      when c.current_count = 1 and c.previous_count = 0 then 'experimental'
      when c.previous_count > 0
       and c.current_count >= c.previous_count + 2
       and c.current_count::numeric >= c.previous_count::numeric * 1.5 then 'acelerando'
      when c.current_count > 0 and c.previous_count > 0 then 'consolidado'
      when c.current_count = 0 and c.previous_count > 0 then 'retirandose'
      else 'sin_senal'
    end as movement,
    c.latest_filing
  from counts c
  join public.intelligence_company_identities i on i.id = c.identity_id
  where c.current_count > 0 or c.previous_count > 0
  order by
    case
      when c.current_count >= 2 and c.previous_count = 0 then 0
      when c.previous_count > 0 and c.current_count >= c.previous_count + 2 and c.current_count::numeric >= c.previous_count::numeric * 1.5 then 1
      when c.current_count > 0 and c.previous_count > 0 then 2
      when c.current_count = 1 and c.previous_count = 0 then 3
      else 4
    end,
    c.current_count desc,
    c.latest_filing desc nulls last;
$$;
revoke execute on function public.analyze_ip_space(text, text, integer) from public, anon, authenticated;
grant execute on function public.analyze_ip_space(text, text, integer) to service_role;

create or replace function public.classification_market_stats(
  p_entity_type text,
  p_codes text[],
  p_window_days integer default 180
) returns table (
  code text,
  current_filings bigint,
  previous_filings bigint,
  current_companies bigint,
  previous_companies bigint,
  entrant_companies bigint,
  experimental_companies bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  with expanded as (
    select a.identity_id, a.filing_date, c.code
    from public.intelligence_company_ip_activity a
    cross join lateral unnest(a.classification_codes) as c(code)
    where p_entity_type in ('patent', 'trademark')
      and p_window_days between 30 and 365
      and cardinality(p_codes) between 1 and 50
      and a.entity_type = p_entity_type
      and a.filing_date >= current_date - (p_window_days * 2)
      and a.classification_codes && p_codes
      and c.code = any(p_codes)
  ), by_company as (
    select
      code,
      identity_id,
      count(*) filter (where filing_date >= current_date - p_window_days) as current_count,
      count(*) filter (
        where filing_date < current_date - p_window_days
          and filing_date >= current_date - (p_window_days * 2)
      ) as previous_count
    from expanded
    group by code, identity_id
  )
  select
    code,
    sum(current_count)::bigint as current_filings,
    sum(previous_count)::bigint as previous_filings,
    count(*) filter (where current_count > 0)::bigint as current_companies,
    count(*) filter (where previous_count > 0)::bigint as previous_companies,
    count(*) filter (where current_count >= 2 and previous_count = 0)::bigint as entrant_companies,
    count(*) filter (where current_count = 1 and previous_count = 0)::bigint as experimental_companies
  from by_company
  group by code
  order by code;
$$;
revoke execute on function public.classification_market_stats(text, text[], integer) from public, anon, authenticated;
grant execute on function public.classification_market_stats(text, text[], integer) to service_role;
