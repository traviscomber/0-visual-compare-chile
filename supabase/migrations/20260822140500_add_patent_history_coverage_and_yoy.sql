-- Competitive Intelligence v3: annual activity and guarded YoY metrics.
-- Growth is enabled only after every official applications year 2009-2025 has a completed sync run.

create or replace function public.get_patent_company_intelligence(
  p_company text,
  p_recent_limit integer default 12
)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  with params as (
    select
      upper(extensions.unaccent(trim(coalesce(p_company, '')))) as q,
      greatest(1, least(coalesce(p_recent_limit, 12), 25)) as recent_limit
  ), history_coverage as (
    select
      count(distinct substring(query from '(\\d{4})$')::integer) filter (
        where query ~ '^solicitudes-de-patentes:(2009|20(1[0-9]|2[0-5]))$'
      )::integer as completed_year_count
    from public.inapi_sync_runs
    where source = 'inapi-patent-open-data'
      and status = 'completed'
      and search_type = 'patent_open_data'
  ), matches as (
    select pr.*
    from public.patent_records pr
    cross join params
    where params.q <> ''
      and (
        upper(extensions.unaccent(coalesce(pr.applicants, ''))) like '%' || params.q || '%'
        or similarity(upper(coalesce(pr.applicants, '')), upper(trim(coalesce(p_company, '')))) >= 0.32
      )
  ), portfolio as (
    select
      count(*)::integer as total_records,
      count(*) filter (where lower(extensions.unaccent(coalesce(status, ''))) like '%registr%')::integer as registered_count,
      count(*) filter (where lower(extensions.unaccent(coalesce(status, ''))) like '%tramite%' or lower(extensions.unaccent(coalesce(status, ''))) like '%pend%')::integer as pending_count,
      count(*) filter (where filing_date >= current_date - 90)::integer as recent_filings_90d,
      count(*) filter (where filing_date >= current_date - 180 and filing_date < current_date - 90)::integer as previous_filings_90d,
      count(*) filter (where publication_date >= current_date - 90)::integer as recent_publications_90d,
      min(filing_date) as first_filing_date,
      max(greatest(
        coalesce(filing_date, date '1900-01-01'),
        coalesce(publication_date, date '1900-01-01'),
        coalesce(registration_date, date '1900-01-01')
      )) as latest_activity_date,
      max(last_synced_at) as newest_sync
    from matches
  ), annual_activity as (
    select extract(year from filing_date)::integer as year, count(*)::integer as filings
    from matches
    where filing_date is not null
    group by extract(year from filing_date)::integer
    order by year
  ), yoy as (
    select
      (extract(year from current_date)::integer - 1) as comparison_year,
      coalesce(max(filings) filter (where year = extract(year from current_date)::integer - 1), 0)::integer as latest_full_year_filings,
      coalesce(max(filings) filter (where year = extract(year from current_date)::integer - 2), 0)::integer as previous_full_year_filings
    from annual_activity
  ), ipc_ranked as (
    select pi.code, left(pi.code, 3) as family, count(distinct pi.patent_record_id)::integer as records
    from matches m
    join public.patent_record_ipc pi on pi.patent_record_id = m.id
    group by pi.code
    order by records desc, pi.code
    limit 15
  ), ipc_families as (
    select count(distinct left(pi.code, 3))::integer as technology_families
    from matches m
    join public.patent_record_ipc pi on pi.patent_record_id = m.id
  ), countries_ranked as (
    select country, count(*)::integer as records
    from matches
    where country is not null and trim(country) <> ''
    group by country
    order by records desc, country
    limit 8
  ), inventor_parts as (
    select trim(part) as inventor
    from matches m,
      lateral regexp_split_to_table(coalesce(m.inventors, ''), E'\\.BR\\.') as part
    where trim(part) <> ''
  ), inventors_ranked as (
    select inventor, count(*)::integer as records
    from inventor_parts
    group by inventor
    order by records desc, inventor
    limit 12
  ), recent as (
    select jsonb_agg(to_jsonb(r) order by r.activity_date desc nulls last, r.title) as items
    from (
      select
        m.id, m.application_number, m.registration_number, m.title, m.status, m.country,
        m.filing_date, m.publication_date, m.registration_date,
        greatest(
          coalesce(m.filing_date, date '1900-01-01'),
          coalesce(m.publication_date, date '1900-01-01'),
          coalesce(m.registration_date, date '1900-01-01')
        ) as activity_date,
        coalesce((select array_agg(distinct pi.code order by pi.code) from public.patent_record_ipc pi where pi.patent_record_id = m.id), '{}') as ipc_codes
      from matches m
      order by activity_date desc nulls last, m.title
      limit (select recent_limit from params)
    ) r
  ), matched_names as (
    select applicants, count(*)::integer as records
    from matches
    where applicants is not null and trim(applicants) <> ''
    group by applicants
    order by records desc, applicants
    limit 10
  )
  select jsonb_build_object(
    'query', trim(coalesce(p_company, '')),
    'matched', (select total_records > 0 from portfolio),
    'portfolio', jsonb_build_object(
      'totalRecords', (select total_records from portfolio),
      'registered', (select registered_count from portfolio),
      'pending', (select pending_count from portfolio),
      'recentFilings90d', (select recent_filings_90d from portfolio),
      'previousFilings90d', (select previous_filings_90d from portfolio),
      'recentPublications90d', (select recent_publications_90d from portfolio),
      'firstFilingDate', (select first_filing_date from portfolio),
      'latestActivityDate', nullif((select latest_activity_date from portfolio), date '1900-01-01'),
      'technologyFamilies', coalesce((select technology_families from ipc_families), 0),
      'newestSync', (select newest_sync from portfolio)
    ),
    'annualActivity', coalesce((select jsonb_agg(to_jsonb(a) order by a.year) from annual_activity a), '[]'::jsonb),
    'growth', jsonb_build_object(
      'comparisonYear', (select comparison_year from yoy),
      'latestFullYearFilings', (select latest_full_year_filings from yoy),
      'previousFullYearFilings', (select previous_full_year_filings from yoy),
      'yearOverYearPct', case
        when (select completed_year_count from history_coverage) = 17
          and (select previous_full_year_filings from yoy) > 0
        then round((((select latest_full_year_filings from yoy) - (select previous_full_year_filings from yoy))::numeric
          / (select previous_full_year_filings from yoy)::numeric) * 100, 1)
        else null
      end
    ),
    'matchedApplicantNames', coalesce((select jsonb_agg(to_jsonb(mn)) from matched_names mn), '[]'::jsonb),
    'topIpc', coalesce((select jsonb_agg(to_jsonb(ir)) from ipc_ranked ir), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(to_jsonb(cr)) from countries_ranked cr), '[]'::jsonb),
    'topInventors', coalesce((select jsonb_agg(to_jsonb(iv)) from inventors_ranked iv), '[]'::jsonb),
    'recentPatents', coalesce((select items from recent), '[]'::jsonb),
    'methodology', jsonb_build_object(
      'scope', 'observed INAPI patent corpus',
      'recentWindowDays', 90,
      'historicalApplicationYearsExpected', 17,
      'historicalApplicationYearsCompleted', (select completed_year_count from history_coverage),
      'growthClaimsEnabled', (select completed_year_count from history_coverage) = 17,
      'note', case
        when (select completed_year_count from history_coverage) = 17
          then 'Official INAPI applications history 2009-2025 is complete; year-over-year filing metrics are enabled.'
        else 'Year-over-year growth remains disabled until all official INAPI applications resources for 2009-2025 are synchronized.'
      end
    )
  );
$$;

revoke all on function public.get_patent_company_intelligence(text,integer) from public;
grant execute on function public.get_patent_company_intelligence(text,integer) to service_role;
