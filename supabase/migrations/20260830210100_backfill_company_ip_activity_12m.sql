with raw_aliases as (
  select
    e.canonical_name as raw_name,
    public.normalize_company_identity(e.canonical_name) as identity_key,
    coalesce(public.company_country_hint(e.canonical_name), nullif(upper(e.country), '')) as country_hint,
    'intelligence_graph'::text as source_scope,
    2 as source_priority,
    e.first_seen_at,
    e.last_seen_at
  from public.intelligence_entities e
  where e.entity_type = 'company'
    and public.normalize_company_identity(e.canonical_name) is not null

  union all

  select
    trim(applicant) as raw_name,
    public.normalize_company_identity(trim(applicant)) as identity_key,
    public.company_country_hint(trim(applicant)) as country_hint,
    'patent_12m'::text as source_scope,
    1 as source_priority,
    coalesce(pr.last_synced_at, now()) as first_seen_at,
    coalesce(pr.last_synced_at, now()) as last_seen_at
  from public.patent_records pr
  cross join lateral regexp_split_to_table(coalesce(pr.applicants, ''), E'[;|\n\r]+') as applicant
  where pr.filing_date >= current_date - 365
    and length(trim(applicant)) >= 2
    and public.normalize_company_identity(trim(applicant)) is not null
),
country_stats as (
  select identity_key,
         count(distinct country_hint) filter (where country_hint is not null) as country_count,
         min(country_hint) filter (where country_hint is not null) as only_country
  from raw_aliases
  group by identity_key
),
resolved_aliases as (
  select r.*,
         coalesce(r.country_hint, case when s.country_count = 1 then s.only_country else null end) as resolved_country,
         coalesce(r.country_hint, case when s.country_count = 1 then s.only_country else '*' end) || ':' || r.identity_key as resolution_key
  from raw_aliases r
  join country_stats s using (identity_key)
),
canonical as (
  select distinct on (resolution_key)
         resolution_key,
         identity_key,
         raw_name as canonical_name,
         resolved_country as country,
         first_seen_at,
         last_seen_at,
         source_priority
  from resolved_aliases
  order by resolution_key, source_priority desc, length(raw_name), raw_name
)
insert into public.intelligence_company_identities (
  resolution_key, identity_key, canonical_name, country, resolution_confidence,
  metadata, first_seen_at, last_seen_at, updated_at
)
select
  c.resolution_key,
  c.identity_key,
  c.canonical_name,
  c.country,
  case when c.country is null then 0.800 else 0.900 end,
  jsonb_build_object('backfill', '12m', 'resolution', 'normalized_exact'),
  c.first_seen_at,
  c.last_seen_at,
  now()
from canonical c
on conflict (resolution_key) do update set
  canonical_name = case
    when length(excluded.canonical_name) < length(public.intelligence_company_identities.canonical_name) then excluded.canonical_name
    else public.intelligence_company_identities.canonical_name
  end,
  last_seen_at = greatest(public.intelligence_company_identities.last_seen_at, excluded.last_seen_at),
  updated_at = now();

with raw_aliases as (
  select
    e.canonical_name as raw_name,
    public.normalize_company_identity(e.canonical_name) as identity_key,
    coalesce(public.company_country_hint(e.canonical_name), nullif(upper(e.country), '')) as country_hint,
    'intelligence_graph'::text as source_scope,
    e.first_seen_at,
    e.last_seen_at
  from public.intelligence_entities e
  where e.entity_type = 'company'
    and public.normalize_company_identity(e.canonical_name) is not null

  union all

  select
    trim(applicant) as raw_name,
    public.normalize_company_identity(trim(applicant)) as identity_key,
    public.company_country_hint(trim(applicant)) as country_hint,
    'patent_12m'::text as source_scope,
    coalesce(pr.last_synced_at, now()) as first_seen_at,
    coalesce(pr.last_synced_at, now()) as last_seen_at
  from public.patent_records pr
  cross join lateral regexp_split_to_table(coalesce(pr.applicants, ''), E'[;|\n\r]+') as applicant
  where pr.filing_date >= current_date - 365
    and length(trim(applicant)) >= 2
    and public.normalize_company_identity(trim(applicant)) is not null
),
country_stats as (
  select identity_key,
         count(distinct country_hint) filter (where country_hint is not null) as country_count,
         min(country_hint) filter (where country_hint is not null) as only_country
  from raw_aliases
  group by identity_key
),
resolved_aliases as (
  select r.*,
         coalesce(r.country_hint, case when s.country_count = 1 then s.only_country else null end) as resolved_country,
         coalesce(r.country_hint, case when s.country_count = 1 then s.only_country else '*' end) || ':' || r.identity_key as resolution_key
  from raw_aliases r
  join country_stats s using (identity_key)
)
insert into public.intelligence_company_aliases (
  identity_id, raw_name, alias_key, country_hint, source_scope,
  resolution_method, confidence, first_seen_at, last_seen_at, metadata, updated_at
)
select
  i.id,
  r.raw_name,
  public.normalize_inapi_search_text(r.raw_name),
  r.country_hint,
  r.source_scope,
  'normalized_exact',
  case when r.resolved_country is null then 0.800 else 0.900 end,
  min(r.first_seen_at),
  max(r.last_seen_at),
  jsonb_build_object('identity_key', r.identity_key, 'resolution_key', r.resolution_key),
  now()
from resolved_aliases r
join public.intelligence_company_identities i on i.resolution_key = r.resolution_key
group by i.id, r.raw_name, r.country_hint, r.source_scope, r.resolved_country, r.identity_key, r.resolution_key
on conflict (identity_id, source_scope, raw_name) do update set
  last_seen_at = greatest(public.intelligence_company_aliases.last_seen_at, excluded.last_seen_at),
  updated_at = now();

insert into public.intelligence_company_ip_activity (
  identity_id, entity_type, source_key, source_record_id, applicant_raw,
  title, filing_date, status, classification_codes, source_url, metadata,
  first_seen_at, last_seen_at, updated_at
)
select
  resolved.identity_id,
  'trademark',
  'inapi_open_data',
  tr.source_record_id,
  tr.solicitante,
  tr.nombre,
  tr.fecha_presentacion,
  tr.estado,
  coalesce((
    select array_agg(distinct n.code order by n.code)
    from public.trademark_record_niza n
    where n.trademark_record_id = tr.id
  ), '{}'::text[]),
  tr.source_url,
  jsonb_build_object('backfill', '12m'),
  coalesce(tr.last_synced_at, now()),
  coalesce(tr.last_synced_at, now()),
  now()
from public.trademark_records tr
join lateral (
  select a.identity_id
  from public.intelligence_company_aliases a
  where a.raw_name = tr.solicitante
  order by case when a.source_scope = 'intelligence_graph' then 0 else 1 end, a.confidence desc
  limit 1
) resolved on true
where tr.fecha_presentacion >= current_date - 365
  and tr.solicitante is not null
  and trim(tr.solicitante) <> ''
  and upper(trim(tr.solicitante)) <> 'DATO NO DISPONIBLE'
on conflict (identity_id, entity_type, source_record_id) do update set
  applicant_raw = excluded.applicant_raw,
  title = excluded.title,
  filing_date = excluded.filing_date,
  status = excluded.status,
  classification_codes = excluded.classification_codes,
  source_url = excluded.source_url,
  last_seen_at = excluded.last_seen_at,
  updated_at = now();

with patent_applicants as (
  select
    pr.*,
    trim(applicant) as applicant_raw
  from public.patent_records pr
  cross join lateral regexp_split_to_table(coalesce(pr.applicants, ''), E'[;|\n\r]+') as applicant
  where pr.filing_date >= current_date - 365
    and length(trim(applicant)) >= 2
)
insert into public.intelligence_company_ip_activity (
  identity_id, entity_type, source_key, source_record_id, applicant_raw,
  title, filing_date, status, classification_codes, source_url, metadata,
  first_seen_at, last_seen_at, updated_at
)
select
  resolved.identity_id,
  'patent',
  'inapi_open_data',
  pr.source_record_id,
  pr.applicant_raw,
  pr.title,
  pr.filing_date,
  pr.status,
  coalesce((
    select array_agg(distinct p.code order by p.code)
    from public.patent_record_ipc p
    where p.patent_record_id = pr.id
  ), '{}'::text[]),
  pr.source_url,
  jsonb_build_object('backfill', '12m'),
  coalesce(pr.last_synced_at, now()),
  coalesce(pr.last_synced_at, now()),
  now()
from patent_applicants pr
join lateral (
  select a.identity_id
  from public.intelligence_company_aliases a
  where a.raw_name = pr.applicant_raw
  order by case when a.source_scope = 'patent_12m' then 0 else 1 end, a.confidence desc
  limit 1
) resolved on true
on conflict (identity_id, entity_type, source_record_id) do update set
  applicant_raw = excluded.applicant_raw,
  title = excluded.title,
  filing_date = excluded.filing_date,
  status = excluded.status,
  classification_codes = excluded.classification_codes,
  source_url = excluded.source_url,
  last_seen_at = excluded.last_seen_at,
  updated_at = now();

update public.intelligence_company_identities i
set metadata = i.metadata || jsonb_build_object(
      'alias_count', coalesce(stats.alias_count, 0),
      'activity_12m', coalesce(stats.activity_12m, 0)
    ),
    last_seen_at = greatest(i.last_seen_at, coalesce(stats.last_seen_at, i.last_seen_at)),
    updated_at = now()
from (
  select i2.id,
         count(distinct a.id)::integer as alias_count,
         count(distinct act.id)::integer as activity_12m,
         max(coalesce(act.last_seen_at, a.last_seen_at)) as last_seen_at
  from public.intelligence_company_identities i2
  left join public.intelligence_company_aliases a on a.identity_id = i2.id
  left join public.intelligence_company_ip_activity act on act.identity_id = i2.id and act.filing_date >= current_date - 365
  group by i2.id
) stats
where stats.id = i.id;
