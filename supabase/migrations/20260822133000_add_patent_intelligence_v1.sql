-- Patent Intelligence v1: official INAPI patent mirror + local search.

create table if not exists public.patent_records (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'inapi',
  source_record_id text not null,
  application_number text,
  registration_number text,
  title text not null,
  applicants text,
  representatives text,
  inventors text,
  filing_date date,
  publication_date date,
  registration_date date,
  expiration_date date,
  type_name text,
  subtype_name text,
  status text,
  country text,
  applicant_location text,
  applicant_region text,
  representative_location text,
  representative_region text,
  pct_application_date date,
  pct_publication_date date,
  priorities text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_record_id)
);

create table if not exists public.patent_record_ipc (
  patent_record_id uuid not null references public.patent_records(id) on delete cascade,
  code text not null,
  primary key (patent_record_id, code)
);

create index if not exists patent_records_application_number_idx on public.patent_records(application_number);
create index if not exists patent_records_registration_number_idx on public.patent_records(registration_number);
create index if not exists patent_records_filing_date_idx on public.patent_records(filing_date desc);
create index if not exists patent_records_status_idx on public.patent_records(status);
create index if not exists patent_records_title_trgm_idx on public.patent_records using gin (upper(title) gin_trgm_ops);
create index if not exists patent_records_applicants_trgm_idx on public.patent_records using gin (upper(applicants) gin_trgm_ops);
create index if not exists patent_record_ipc_code_idx on public.patent_record_ipc(code, patent_record_id);

alter table public.patent_records enable row level security;
alter table public.patent_record_ipc enable row level security;

revoke all on public.patent_records from anon, authenticated;
revoke all on public.patent_record_ipc from anon, authenticated;
grant all on public.patent_records to service_role;
grant all on public.patent_record_ipc to service_role;

create or replace function public.search_patents_local(
  p_query text,
  p_ipc_prefix text default null,
  p_limit integer default 25
)
returns table (
  id uuid,
  application_number text,
  registration_number text,
  title text,
  applicants text,
  inventors text,
  status text,
  country text,
  filing_date date,
  registration_date date,
  expiration_date date,
  ipc_codes text[],
  source_url text,
  last_synced_at timestamptz,
  title_similarity real,
  applicant_similarity real,
  relevance_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select upper(trim(coalesce(p_query, ''))) as q,
           nullif(upper(trim(coalesce(p_ipc_prefix, ''))), '') as ipc,
           greatest(1, least(coalesce(p_limit, 25), 100)) as lim
  ), candidates as (
    select pr.*,
           similarity(upper(pr.title), params.q)::real as title_similarity,
           similarity(upper(coalesce(pr.applicants, '')), params.q)::real as applicant_similarity
    from public.patent_records pr
    cross join params
    where params.q <> ''
      and (
        upper(pr.title) % params.q
        or upper(coalesce(pr.applicants, '')) % params.q
        or upper(pr.title) like '%' || params.q || '%'
        or upper(coalesce(pr.applicants, '')) like '%' || params.q || '%'
      )
    order by greatest(
      similarity(upper(pr.title), params.q),
      similarity(upper(coalesce(pr.applicants, '')), params.q)
    ) desc
    limit 250
  )
  select
    c.id,
    c.application_number,
    c.registration_number,
    c.title,
    c.applicants,
    c.inventors,
    c.status,
    c.country,
    c.filing_date,
    c.registration_date,
    c.expiration_date,
    coalesce(array_agg(distinct pi.code) filter (where pi.code is not null), '{}') as ipc_codes,
    c.source_url,
    c.last_synced_at,
    c.title_similarity,
    c.applicant_similarity,
    (
      greatest(c.title_similarity, c.applicant_similarity) * 70
      + case when upper(c.title) = (select q from params) then 25 else 0 end
      + case when exists (
          select 1 from public.patent_record_ipc px
          where px.patent_record_id = c.id
            and (select ipc from params) is not null
            and upper(px.code) like (select ipc from params) || '%'
        ) then 20 else 0 end
      + case when lower(coalesce(c.status,'')) in ('registrada','en trámite','en tramite') then 5 else 0 end
    )::numeric as relevance_score
  from candidates c
  left join public.patent_record_ipc pi on pi.patent_record_id = c.id
  where (select ipc from params) is null
     or exists (
       select 1 from public.patent_record_ipc px
       where px.patent_record_id = c.id
         and upper(px.code) like (select ipc from params) || '%'
     )
  group by c.id, c.application_number, c.registration_number, c.title, c.applicants, c.inventors,
           c.status, c.country, c.filing_date, c.registration_date, c.expiration_date, c.source_url,
           c.last_synced_at, c.title_similarity, c.applicant_similarity
  order by relevance_score desc, c.filing_date desc nulls last
  limit (select lim from params);
$$;

revoke all on function public.search_patents_local(text,text,integer) from public;
grant execute on function public.search_patents_local(text,text,integer) to service_role;
