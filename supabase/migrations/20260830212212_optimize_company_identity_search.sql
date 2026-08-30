alter table public.intelligence_company_identities
  add column if not exists canonical_identity_key text
  generated always as (public.normalize_company_identity(canonical_name)) stored;

create index if not exists intelligence_company_identities_canonical_trgm_idx
  on public.intelligence_company_identities using gin (canonical_identity_key extensions.gin_trgm_ops);

create index if not exists intelligence_company_identities_country_canonical_idx
  on public.intelligence_company_identities (country, canonical_identity_key);

drop index if exists public.intelligence_company_identities_name_trgm_idx;
drop index if exists public.intelligence_company_identities_identity_trgm_idx;

create or replace function public.search_company_identities(p_query text, p_limit integer default 8)
returns table (
  id uuid,
  resolution_key text,
  identity_key text,
  canonical_name text,
  country text,
  resolution_confidence numeric,
  similarity_score real,
  activity_12m bigint
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  with params as (
    select public.normalize_company_identity(trim(coalesce(p_query, ''))) as q,
           greatest(1, least(coalesce(p_limit, 8), 20)) as lim
  ), shortlist as (
    select i.*,
           extensions.similarity(i.canonical_identity_key, params.q)::real as score,
           case
             when i.canonical_identity_key = params.q then 0
             when i.canonical_identity_key like params.q || ' %' then 1
             else 2
           end as exact_rank
    from public.intelligence_company_identities i
    cross join params
    where params.q is not null
      and i.canonical_identity_key is not null
      and (
        i.canonical_identity_key = params.q
        or i.canonical_identity_key % params.q
        or i.canonical_identity_key like '%' || params.q || '%'
      )
    order by exact_rank, score desc, i.last_seen_at desc
    limit 120
  ), candidates as (
    select s.*,
           coalesce((
             select count(*)::bigint
             from public.intelligence_company_ip_activity a
             where a.identity_id = s.id
               and a.filing_date >= current_date - 365
           ), 0)::bigint as activity_12m
    from shortlist s
  ), deduped as (
    select c.*,
           row_number() over (
             partition by coalesce(c.country, '*'), c.canonical_identity_key
             order by c.activity_12m desc,
                      case when c.identity_key = c.canonical_identity_key then 0 else 1 end,
                      c.resolution_confidence desc,
                      length(c.canonical_name),
                      c.canonical_name
           ) as identity_rank
    from candidates c
  )
  select d.id,
         d.resolution_key,
         d.identity_key,
         d.canonical_name,
         d.country,
         d.resolution_confidence,
         d.score,
         d.activity_12m
  from deduped d
  where d.identity_rank = 1
  order by d.exact_rank,
           d.score desc,
           d.activity_12m desc,
           d.canonical_name asc
  limit (select lim from params)
$$;

revoke all on function public.search_company_identities(text, integer) from public, anon, authenticated;
grant execute on function public.search_company_identities(text, integer) to service_role;
