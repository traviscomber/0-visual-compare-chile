create table public.intelligence_company_identity_reviews (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references public.intelligence_company_identities(id) on delete cascade,
  resolution_key text not null,
  raw_name text not null,
  identity_key text not null,
  country_hint text,
  resolution_method text not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  review_reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  evidence jsonb not null default '{}'::jsonb,
  decision jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index intelligence_company_identity_reviews_pending_idx
  on public.intelligence_company_identity_reviews(identity_id, raw_name, review_reason)
  where status = 'pending';

create index intelligence_company_identity_reviews_status_idx
  on public.intelligence_company_identity_reviews(status, requested_at desc);

alter table public.intelligence_company_identity_reviews enable row level security;
revoke all on public.intelligence_company_identity_reviews from public, anon, authenticated;
grant select, insert, update, delete on public.intelligence_company_identity_reviews to service_role;

create or replace function public.company_identity_auto_link_allowed(
  p_resolution_method text,
  p_confidence numeric,
  p_country_hint text
)
returns boolean
language sql
immutable
parallel safe
set search_path = public, pg_temp
as $$
  select coalesce(
    lower(trim(p_resolution_method)) = 'normalized_exact'
    and p_confidence >= 0.900
    and nullif(trim(p_country_hint), '') is not null,
    false
  )
$$;

revoke all on function public.company_identity_auto_link_allowed(text, numeric, text) from public, anon, authenticated;
grant execute on function public.company_identity_auto_link_allowed(text, numeric, text) to service_role;

create or replace function public.refresh_company_ip_activity_from_sync(p_since timestamp with time zone)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_identities integer := 0;
  v_aliases integer := 0;
  v_trademarks integer := 0;
  v_patents integer := 0;
  v_touched integer := 0;
  v_reviews integer := 0;
begin
  if p_since is null then
    raise exception 'p_since is required';
  end if;

  create temporary table tmp_company_applicants on commit drop as
  select distinct
         part.applicant as raw_name,
         public.normalize_company_identity(part.applicant) as identity_key,
         public.company_country_hint(part.applicant) as country_hint,
         'trademark_current_sync'::text as source_scope
  from public.trademark_records tr
  cross join lateral public.split_company_applicants(tr.solicitante) part
  where tr.last_synced_at >= p_since
    and tr.fecha_presentacion >= current_date - 370
    and tr.solicitante is not null
    and upper(trim(tr.solicitante)) <> 'DATO NO DISPONIBLE'
    and public.normalize_company_identity(part.applicant) is not null
    and char_length(public.normalize_company_identity(part.applicant)) between 2 and 200

  union

  select distinct
         part.applicant as raw_name,
         public.normalize_company_identity(part.applicant) as identity_key,
         public.company_country_hint(part.applicant) as country_hint,
         'patent_current_sync'::text as source_scope
  from public.patent_records pr
  cross join lateral public.split_company_applicants(pr.applicants) part
  where pr.last_synced_at >= p_since
    and pr.filing_date >= current_date - 370
    and pr.applicants is not null
    and public.normalize_company_identity(part.applicant) is not null
    and char_length(public.normalize_company_identity(part.applicant)) between 2 and 200;

  create temporary table tmp_company_resolved on commit drop as
  select a.*,
         case
           when a.country_hint is not null then a.country_hint || ':' || a.identity_key
           else '*:' || a.identity_key
         end as resolution_key,
         case when a.country_hint is null then 0.800::numeric else 0.900::numeric end as resolution_confidence
  from tmp_company_applicants a;

  insert into public.intelligence_company_identities (
    resolution_key, identity_key, canonical_name, country, resolution_confidence,
    metadata, first_seen_at, last_seen_at, updated_at
  )
  select distinct on (r.resolution_key)
         r.resolution_key,
         r.identity_key,
         r.raw_name,
         r.country_hint,
         r.resolution_confidence,
         jsonb_build_object(
           'source', 'inapi_current_sync',
           'resolution', 'normalized_exact',
           'resolution_policy', case when public.company_identity_auto_link_allowed('normalized_exact', r.resolution_confidence, r.country_hint) then 'auto_link' else 'review_required' end,
           'review_required', not public.company_identity_auto_link_allowed('normalized_exact', r.resolution_confidence, r.country_hint)
         ),
         now(), now(), now()
  from tmp_company_resolved r
  order by r.resolution_key, length(r.raw_name), r.raw_name
  on conflict (resolution_key) do update set
    last_seen_at = now(),
    metadata = public.intelligence_company_identities.metadata || excluded.metadata,
    updated_at = now();
  get diagnostics v_identities = row_count;

  insert into public.intelligence_company_aliases (
    identity_id, raw_name, alias_key, country_hint, source_scope,
    resolution_method, confidence, first_seen_at, last_seen_at, metadata, updated_at
  )
  select i.id,
         r.raw_name,
         public.normalize_inapi_search_text(r.raw_name),
         r.country_hint,
         r.source_scope,
         'normalized_exact',
         r.resolution_confidence,
         now(), now(),
         jsonb_build_object(
           'identity_key', r.identity_key,
           'resolution_key', r.resolution_key,
           'resolution_policy', case when public.company_identity_auto_link_allowed('normalized_exact', r.resolution_confidence, r.country_hint) then 'auto_link' else 'review_required' end,
           'review_required', not public.company_identity_auto_link_allowed('normalized_exact', r.resolution_confidence, r.country_hint)
         ),
         now()
  from tmp_company_resolved r
  join public.intelligence_company_identities i on i.resolution_key = r.resolution_key
  on conflict (identity_id, source_scope, raw_name) do update set
    last_seen_at = now(),
    confidence = excluded.confidence,
    metadata = public.intelligence_company_aliases.metadata || excluded.metadata,
    updated_at = now();
  get diagnostics v_aliases = row_count;

  insert into public.intelligence_company_identity_reviews (
    identity_id, resolution_key, raw_name, identity_key, country_hint,
    resolution_method, confidence, review_reason, evidence
  )
  select i.id,
         r.resolution_key,
         r.raw_name,
         r.identity_key,
         r.country_hint,
         'normalized_exact',
         r.resolution_confidence,
         'missing_country_context',
         jsonb_build_object('source_scope', r.source_scope, 'policy', 'normalized_exact_country_090')
  from tmp_company_resolved r
  join public.intelligence_company_identities i on i.resolution_key = r.resolution_key
  where not public.company_identity_auto_link_allowed('normalized_exact', r.resolution_confidence, r.country_hint)
    and not exists (
      select 1
      from public.intelligence_company_identity_reviews q
      where q.identity_id = i.id
        and q.raw_name = r.raw_name
        and q.review_reason = 'missing_country_context'
        and q.status = 'pending'
    );
  get diagnostics v_reviews = row_count;

  create temporary table tmp_company_map on commit drop as
  select distinct r.raw_name, i.id as identity_id
  from tmp_company_resolved r
  join public.intelligence_company_identities i on i.resolution_key = r.resolution_key;

  insert into public.intelligence_company_ip_activity (
    identity_id, entity_type, source_key, source_record_id, applicant_raw,
    title, filing_date, status, classification_codes, source_url, metadata,
    first_seen_at, last_seen_at, updated_at
  )
  select distinct on (m.identity_id, tr.source_record_id)
         m.identity_id,
         'trademark',
         'inapi_open_data',
         tr.source_record_id,
         part.applicant,
         tr.nombre,
         tr.fecha_presentacion,
         tr.estado,
         coalesce((
           select array_agg(distinct n.code order by n.code)
           from public.trademark_record_niza n
           where n.trademark_record_id = tr.id
         ), '{}'::text[]),
         tr.source_url,
         jsonb_build_object('source', 'daily_sync'),
         coalesce(tr.last_synced_at, now()),
         coalesce(tr.last_synced_at, now()),
         now()
  from public.trademark_records tr
  cross join lateral public.split_company_applicants(tr.solicitante) part
  join tmp_company_map m on m.raw_name = part.applicant
  where tr.last_synced_at >= p_since
    and tr.fecha_presentacion >= current_date - 370
    and tr.solicitante is not null
    and upper(trim(tr.solicitante)) <> 'DATO NO DISPONIBLE'
  order by m.identity_id, tr.source_record_id, part.applicant
  on conflict (identity_id, entity_type, source_record_id) do update set
    applicant_raw = excluded.applicant_raw,
    title = excluded.title,
    filing_date = excluded.filing_date,
    status = excluded.status,
    classification_codes = excluded.classification_codes,
    source_url = excluded.source_url,
    last_seen_at = excluded.last_seen_at,
    metadata = public.intelligence_company_ip_activity.metadata || excluded.metadata,
    updated_at = now();
  get diagnostics v_trademarks = row_count;

  insert into public.intelligence_company_ip_activity (
    identity_id, entity_type, source_key, source_record_id, applicant_raw,
    title, filing_date, status, classification_codes, source_url, metadata,
    first_seen_at, last_seen_at, updated_at
  )
  select distinct on (m.identity_id, pr.source_record_id)
         m.identity_id,
         'patent',
         'inapi_open_data',
         pr.source_record_id,
         part.applicant,
         pr.title,
         pr.filing_date,
         pr.status,
         coalesce((
           select array_agg(distinct p.code order by p.code)
           from public.patent_record_ipc p
           where p.patent_record_id = pr.id
         ), '{}'::text[]),
         pr.source_url,
         jsonb_build_object('source', 'daily_sync'),
         coalesce(pr.last_synced_at, now()),
         coalesce(pr.last_synced_at, now()),
         now()
  from public.patent_records pr
  cross join lateral public.split_company_applicants(pr.applicants) part
  join tmp_company_map m on m.raw_name = part.applicant
  where pr.last_synced_at >= p_since
    and pr.filing_date >= current_date - 370
    and pr.applicants is not null
  order by m.identity_id, pr.source_record_id, part.applicant
  on conflict (identity_id, entity_type, source_record_id) do update set
    applicant_raw = excluded.applicant_raw,
    title = excluded.title,
    filing_date = excluded.filing_date,
    status = excluded.status,
    classification_codes = excluded.classification_codes,
    source_url = excluded.source_url,
    last_seen_at = excluded.last_seen_at,
    metadata = public.intelligence_company_ip_activity.metadata || excluded.metadata,
    updated_at = now();
  get diagnostics v_patents = row_count;

  select count(distinct identity_id) into v_touched from tmp_company_map;

  return jsonb_build_object(
    'since', p_since,
    'identities_touched', v_touched,
    'identity_upserts', v_identities,
    'alias_upserts', v_aliases,
    'reviews_pending', v_reviews,
    'trademark_activity_upserts', v_trademarks,
    'patent_activity_upserts', v_patents,
    'activity_upserts', v_trademarks + v_patents
  );
end;
$$;

revoke all on function public.refresh_company_ip_activity_from_sync(timestamp with time zone) from public, anon, authenticated;
grant execute on function public.refresh_company_ip_activity_from_sync(timestamp with time zone) to service_role;
