create or replace function public.refresh_company_ip_activity_from_sync(p_since timestamptz)
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
         coalesce(
           case when a.country_hint is not null then a.country_hint || ':' || a.identity_key end,
           (
             select min(i.resolution_key)
             from public.intelligence_company_identities i
             where i.identity_key = a.identity_key
             having count(*) = 1
           ),
           '*:' || a.identity_key
         ) as resolution_key
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
         case when r.country_hint is null then 0.800 else 0.900 end,
         jsonb_build_object('source', 'inapi_current_sync', 'resolution', 'normalized_exact'),
         now(), now(), now()
  from tmp_company_resolved r
  order by r.resolution_key, length(r.raw_name), r.raw_name
  on conflict (resolution_key) do update set
    last_seen_at = now(),
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
         case when r.country_hint is null then 0.800 else 0.900 end,
         now(), now(),
         jsonb_build_object('identity_key', r.identity_key, 'resolution_key', r.resolution_key),
         now()
  from tmp_company_resolved r
  join public.intelligence_company_identities i on i.resolution_key = r.resolution_key
  on conflict (identity_id, source_scope, raw_name) do update set
    last_seen_at = now(),
    updated_at = now();
  get diagnostics v_aliases = row_count;

  create temporary table tmp_company_map on commit drop as
  select distinct r.raw_name, i.id as identity_id
  from tmp_company_resolved r
  join public.intelligence_company_identities i on i.resolution_key = r.resolution_key;

  insert into public.intelligence_company_ip_activity (
    identity_id, entity_type, source_key, source_record_id, applicant_raw,
    title, filing_date, status, classification_codes, source_url, metadata,
    first_seen_at, last_seen_at, updated_at
  )
  select m.identity_id,
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
  select m.identity_id,
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
    'trademark_activity_upserts', v_trademarks,
    'patent_activity_upserts', v_patents,
    'activity_upserts', v_trademarks + v_patents
  );
end;
$$;

revoke all on function public.refresh_company_ip_activity_from_sync(timestamptz) from public, anon, authenticated;
grant execute on function public.refresh_company_ip_activity_from_sync(timestamptz) to service_role;
