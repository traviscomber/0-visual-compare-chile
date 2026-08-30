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
      regexp_replace(value, '^(S A C I|SACI)[[:space:]]+', ''),
      '([[:space:]]+(S A|SA|S P A|SPA|LTDA|LIMITADA|INC|LLC|LTD|LIMITED|CO LTD|CORP|CORPORATION|GMBH|SAS|N V|NV|AG|PLC|PTE LTD))+$',
      '',
      'g'
    )
  ), '')
  from normalized
$$;

create or replace function public.company_country_hint(value text)
returns text
language sql
immutable
parallel safe
set search_path = public, pg_temp
as $$
  select nullif((regexp_match(upper(trim(coalesce(value, ''))), '^\(([A-Z]{2})\)'))[1], '')
$$;

create table if not exists public.intelligence_company_identities (
  id uuid primary key default gen_random_uuid(),
  resolution_key text not null unique,
  identity_key text not null,
  canonical_name text not null,
  country text,
  resolution_confidence numeric(4,3) not null default 0.880 check (resolution_confidence between 0 and 1),
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_company_identities_identity_key_len check (char_length(identity_key) between 2 and 200)
);

create index if not exists intelligence_company_identities_identity_idx
  on public.intelligence_company_identities (identity_key);
create index if not exists intelligence_company_identities_name_trgm_idx
  on public.intelligence_company_identities using gin (canonical_name extensions.gin_trgm_ops);
create index if not exists intelligence_company_identities_identity_trgm_idx
  on public.intelligence_company_identities using gin (identity_key extensions.gin_trgm_ops);

create table if not exists public.intelligence_company_aliases (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references public.intelligence_company_identities(id) on delete cascade,
  raw_name text not null,
  alias_key text not null,
  country_hint text,
  source_scope text not null,
  resolution_method text not null default 'normalized_exact',
  confidence numeric(4,3) not null default 0.880 check (confidence between 0 and 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_company_aliases_unique unique (identity_id, source_scope, raw_name)
);

create index if not exists intelligence_company_aliases_raw_idx
  on public.intelligence_company_aliases (raw_name);
create index if not exists intelligence_company_aliases_key_idx
  on public.intelligence_company_aliases (alias_key);
create index if not exists intelligence_company_aliases_identity_idx
  on public.intelligence_company_aliases (identity_id);

create table if not exists public.intelligence_company_ip_activity (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references public.intelligence_company_identities(id) on delete cascade,
  entity_type text not null check (entity_type in ('patent', 'trademark')),
  source_key text not null default 'inapi_open_data',
  source_record_id text not null,
  applicant_raw text not null,
  title text not null,
  filing_date date,
  status text,
  classification_codes text[] not null default '{}'::text[],
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_company_ip_activity_unique unique (identity_id, entity_type, source_record_id)
);

create index if not exists intelligence_company_ip_activity_identity_date_idx
  on public.intelligence_company_ip_activity (identity_id, filing_date desc);
create index if not exists intelligence_company_ip_activity_type_date_idx
  on public.intelligence_company_ip_activity (identity_id, entity_type, filing_date desc);
create index if not exists intelligence_company_ip_activity_classification_idx
  on public.intelligence_company_ip_activity using gin (classification_codes);

alter table public.intelligence_company_identities enable row level security;
alter table public.intelligence_company_aliases enable row level security;
alter table public.intelligence_company_ip_activity enable row level security;

revoke all on table public.intelligence_company_identities from anon, authenticated;
revoke all on table public.intelligence_company_aliases from anon, authenticated;
revoke all on table public.intelligence_company_ip_activity from anon, authenticated;
grant select, insert, update, delete on table public.intelligence_company_identities to service_role;
grant select, insert, update, delete on table public.intelligence_company_aliases to service_role;
grant select, insert, update, delete on table public.intelligence_company_ip_activity to service_role;

drop policy if exists intelligence_company_identities_service_role on public.intelligence_company_identities;
create policy intelligence_company_identities_service_role on public.intelligence_company_identities
  for all to service_role using (true) with check (true);
drop policy if exists intelligence_company_aliases_service_role on public.intelligence_company_aliases;
create policy intelligence_company_aliases_service_role on public.intelligence_company_aliases
  for all to service_role using (true) with check (true);
drop policy if exists intelligence_company_ip_activity_service_role on public.intelligence_company_ip_activity;
create policy intelligence_company_ip_activity_service_role on public.intelligence_company_ip_activity
  for all to service_role using (true) with check (true);

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
             extensions.word_similarity(params.q, public.normalize_company_identity(i.canonical_name))
           )::real as score
    from public.intelligence_company_identities i
    cross join params
    where params.q is not null
      and (
        i.identity_key = params.q
        or i.identity_key % params.q
        or params.q <% i.identity_key
        or public.normalize_company_identity(i.canonical_name) like '%' || params.q || '%'
      )
    order by case when i.identity_key = params.q then 0 else 1 end, score desc, i.last_seen_at desc
    limit 40
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
  group by r.id, r.resolution_key, r.identity_key, r.canonical_name, r.country, r.resolution_confidence, r.score
  order by case when r.identity_key = (select q from params) then 0 else 1 end,
           r.score desc,
           activity_12m desc,
           r.canonical_name asc
  limit (select lim from params)
$$;

revoke all on function public.search_company_identities(text, integer) from public, anon, authenticated;
grant execute on function public.search_company_identities(text, integer) to service_role;
