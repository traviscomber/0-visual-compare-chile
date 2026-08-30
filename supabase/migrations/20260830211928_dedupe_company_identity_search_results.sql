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
  ), activity as (
    select a.identity_id, count(*)::bigint as activity_12m
    from public.intelligence_company_ip_activity a
    where a.filing_date >= current_date - 365
    group by a.identity_id
  ), candidates as (
    select i.*,
           public.normalize_company_identity(i.canonical_name) as canonical_core,
           coalesce(act.activity_12m, 0)::bigint as activity_12m,
           greatest(
             extensions.similarity(public.normalize_company_identity(i.canonical_name), params.q),
             extensions.similarity(i.identity_key, params.q)
           )::real as score,
           case
             when public.normalize_company_identity(i.canonical_name) = params.q then 0
             when i.identity_key = params.q then 1
             when public.normalize_company_identity(i.canonical_name) like params.q || ' %' then 2
             else 3
           end as exact_rank
    from public.intelligence_company_identities i
    cross join params
    left join activity act on act.identity_id = i.id
    where params.q is not null
      and (
        public.normalize_company_identity(i.canonical_name) = params.q
        or i.identity_key = params.q
        or i.identity_key % params.q
        or params.q <% i.identity_key
        or public.normalize_company_identity(i.canonical_name) like '%' || params.q || '%'
      )
  ), deduped as (
    select c.*,
           row_number() over (
             partition by coalesce(c.country, '*'), c.canonical_core
             order by c.activity_12m desc,
                      case when c.identity_key = c.canonical_core then 0 else 1 end,
                      c.resolution_confidence desc,
                      length(c.canonical_name),
                      c.canonical_name
           ) as identity_rank
    from candidates c
    where c.canonical_core is not null
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
