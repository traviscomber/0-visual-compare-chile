create or replace function public.normalize_company_identity(value text)
returns text
language sql
immutable
parallel safe
set search_path = public, extensions
as $$
  with normalized as (
    select trim(
      regexp_replace(
        regexp_replace(
          upper(extensions.unaccent(coalesce(value, ''))),
          '^[[:space:]]*\([A-Z]{2}\)[[:space:]]*',
          ''
        ),
        '[^A-Z0-9]+',
        ' ',
        'g'
      )
    ) as value
  )
  select nullif(trim(
    regexp_replace(
      regexp_replace(
        value,
        '^(S A C I|SACI|S A I C|SAIC)[[:space:]]+',
        ''
      ),
      '([[:space:]]+(S A|SA|S P A|SPA|LTDA|LIMITADA|INC|LLC|LTD|LIMITED|CO LTD|CORP|CORPORATION|GMBH|SAS|N V|NV|AG|PLC|PTE LTD|S A C I|SACI|S A I C|SAIC|S A C I COMERCIANTE))+$',
      '',
      'g'
    )
  ), '')
  from normalized
$$;

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
  ), ranked as (
    select i.*,
           greatest(
             extensions.similarity(i.identity_key, params.q),
             extensions.similarity(public.normalize_company_identity(i.canonical_name), params.q)
           )::real as score,
           case
             when i.identity_key = params.q then 0
             when public.normalize_company_identity(i.canonical_name) = params.q then 1
             when i.identity_key like params.q || ' %' then 2
             else 3
           end as exact_rank
    from public.intelligence_company_identities i
    cross join params
    where params.q is not null
      and (
        i.identity_key = params.q
        or public.normalize_company_identity(i.canonical_name) = params.q
        or i.identity_key % params.q
        or params.q <% i.identity_key
        or public.normalize_company_identity(i.canonical_name) like '%' || params.q || '%'
      )
    order by exact_rank, score desc, i.last_seen_at desc
    limit 50
  )
  select r.id,
         r.resolution_key,
         r.identity_key,
         r.canonical_name,
         r.country,
         r.resolution_confidence,
         r.score,
         count(a.id)::bigint as activity_12m
  from ranked r
  left join public.intelligence_company_ip_activity a
    on a.identity_id = r.id
   and a.filing_date >= current_date - 365
  group by r.id, r.resolution_key, r.identity_key, r.canonical_name, r.country, r.resolution_confidence, r.score, r.exact_rank
  order by r.exact_rank,
           r.score desc,
           activity_12m desc,
           r.canonical_name asc
  limit (select lim from params)
$$;

revoke all on function public.search_company_identities(text, integer) from public, anon, authenticated;
grant execute on function public.search_company_identities(text, integer) to service_role;
