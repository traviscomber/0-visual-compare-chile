create or replace function public.search_patents_local(
  p_query text,
  p_ipc_prefix text default null,
  p_limit integer default 25
)
returns table(
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
set search_path to 'public', 'extensions'
as $function$
  with params as (
    select public.normalize_inapi_search_text(trim(coalesce(p_query, ''))) as q,
           nullif(upper(trim(coalesce(p_ipc_prefix, ''))), '') as ipc,
           greatest(1, least(coalesce(p_limit, 25), 100)) as lim
  ), candidates as (
    select pr.*,
           word_similarity(params.q, public.normalize_inapi_search_text(coalesce(pr.title, '')))::real as title_similarity,
           word_similarity(params.q, public.normalize_inapi_search_text(coalesce(pr.applicants, '')))::real as applicant_similarity
    from public.patent_records pr
    cross join params
    where params.q <> ''
      and (
        public.normalize_inapi_search_text(pr.title) like '%' || params.q || '%'
        or public.normalize_inapi_search_text(pr.applicants) like '%' || params.q || '%'
        or params.q <% public.normalize_inapi_search_text(pr.title)
        or params.q <% public.normalize_inapi_search_text(pr.applicants)
      )
    order by greatest(
      word_similarity(params.q, public.normalize_inapi_search_text(coalesce(pr.title, ''))),
      word_similarity(params.q, public.normalize_inapi_search_text(coalesce(pr.applicants, '')))
    ) desc
    limit 250
  )
  select c.id,
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
           + case when public.normalize_inapi_search_text(coalesce(c.title, '')) = (select q from params) then 25 else 0 end
           + case when exists (
               select 1
               from public.patent_record_ipc px
               where px.patent_record_id = c.id
                 and (select ipc from params) is not null
                 and px.code like (select ipc from params) || '%'
             ) then 20 else 0 end
           + case when lower(coalesce(c.status, '')) in ('registrada', 'en trámite', 'en tramite') then 5 else 0 end
         )::numeric as relevance_score
  from candidates c
  left join public.patent_record_ipc pi on pi.patent_record_id = c.id
  where (select ipc from params) is null
     or exists (
       select 1
       from public.patent_record_ipc px
       where px.patent_record_id = c.id
         and px.code like (select ipc from params) || '%'
     )
  group by c.id,
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
           c.source_url,
           c.last_synced_at,
           c.title_similarity,
           c.applicant_similarity
  order by relevance_score desc, c.filing_date desc nulls last
  limit (select lim from params);
$function$;
