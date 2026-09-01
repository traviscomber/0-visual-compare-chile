create or replace function public.refresh_company_ip_activity_from_sync_batch(
  p_since timestamptz,
  p_limit integer default 750
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_source_id uuid;
  v_cursor jsonb := '{}'::jsonb;
  v_previous_success timestamptz;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_after_entity text;
  v_after_source_record_id text;
  v_limit integer;
  v_bootstrap boolean := false;
  v_source_records integer := 0;
  v_identities integer := 0;
  v_aliases integer := 0;
  v_trademarks integer := 0;
  v_patents integer := 0;
  v_touched integer := 0;
  v_reviews integer := 0;
  v_next_entity text;
  v_next_source_record_id text;
  v_done boolean := false;
begin
  if p_since is null then
    raise exception 'p_since is required';
  end if;

  v_limit := greatest(100, least(coalesce(p_limit, 750), 1000));

  select s.id,
         coalesce(st.cursor, '{}'::jsonb),
         st.last_success_at
    into v_source_id, v_cursor, v_previous_success
  from public.intelligence_sources s
  join public.intelligence_source_state st on st.source_id = s.id
  where s.source_key = 'inapi_open_data'
  for update of st;

  if v_source_id is null then
    raise exception 'inapi_open_data source state is missing';
  end if;

  v_window_start := coalesce(
    nullif(v_cursor ->> 'company_activity_success_at', '')::timestamptz,
    case
      when v_previous_success is not null and v_previous_success < p_since then v_previous_success
      else p_since
    end
  );

  v_window_end := nullif(v_cursor ->> 'company_activity_batch_upper_at', '')::timestamptz;
  v_after_entity := nullif(v_cursor ->> 'company_activity_batch_entity', '');
  v_after_source_record_id := nullif(v_cursor ->> 'company_activity_batch_source_record_id', '');

  if v_window_end is null then
    v_window_end := clock_timestamp();
    v_after_entity := null;
    v_after_source_record_id := null;
  end if;

  select not exists (select 1 from public.intelligence_company_ip_activity limit 1)
    into v_bootstrap;

  create temporary table tmp_company_source_ids (
    entity_type text not null,
    source_record_id text not null,
    primary key (entity_type, source_record_id)
  ) on commit drop;

  insert into tmp_company_source_ids (entity_type, source_record_id)
  with candidates as (
    select distinct e.entity_type, e.source_record_id
    from public.intelligence_source_events e
    where e.source_key = 'inapi_open_data'
      and e.observed_at >= v_window_start
      and e.observed_at < v_window_end
      and e.entity_type in ('trademark', 'patent')

    union

    select 'trademark'::text, tr.source_record_id
    from public.trademark_records tr
    where tr.source = 'inapi'
      and tr.created_at >= v_window_start
      and tr.created_at < v_window_end

    union

    select 'patent'::text, pr.source_record_id
    from public.patent_records pr
    where pr.source = 'inapi'
      and pr.created_at >= v_window_start
      and pr.created_at < v_window_end

    union

    select 'trademark'::text, tr.source_record_id
    from public.trademark_records tr
    where v_bootstrap
      and tr.last_synced_at >= p_since
      and tr.fecha_presentacion >= current_date - 370
      and tr.solicitante is not null

    union

    select 'patent'::text, pr.source_record_id
    from public.patent_records pr
    where v_bootstrap
      and pr.last_synced_at >= p_since
      and pr.filing_date >= current_date - 370
      and pr.applicants is not null
  )
  select c.entity_type, c.source_record_id
  from candidates c
  where v_after_entity is null
     or (c.entity_type, c.source_record_id) > (v_after_entity, v_after_source_record_id)
  order by c.entity_type, c.source_record_id
  limit v_limit;

  select count(*) into v_source_records from tmp_company_source_ids;

  if v_source_records = 0 then
    v_done := true;
  else
    create temporary table tmp_company_applicants on commit drop as
    select distinct
           part.applicant as raw_name,
           normalized.identity_key,
           public.company_country_hint(part.applicant) as country_hint,
           'trademark_current_sync'::text as source_scope
    from tmp_company_source_ids sid
    join public.trademark_records tr
      on sid.entity_type = 'trademark'
     and tr.source = 'inapi'
     and tr.source_record_id = sid.source_record_id
    cross join lateral public.split_company_applicants(tr.solicitante) part
    cross join lateral (select public.normalize_company_identity(part.applicant) as identity_key) normalized
    where tr.fecha_presentacion >= current_date - 370
      and tr.solicitante is not null
      and upper(trim(tr.solicitante)) <> 'DATO NO DISPONIBLE'
      and normalized.identity_key is not null
      and char_length(normalized.identity_key) between 2 and 200

    union

    select distinct
           part.applicant as raw_name,
           normalized.identity_key,
           public.company_country_hint(part.applicant) as country_hint,
           'patent_current_sync'::text as source_scope
    from tmp_company_source_ids sid
    join public.patent_records pr
      on sid.entity_type = 'patent'
     and pr.source = 'inapi'
     and pr.source_record_id = sid.source_record_id
    cross join lateral public.split_company_applicants(pr.applicants) part
    cross join lateral (select public.normalize_company_identity(part.applicant) as identity_key) normalized
    where pr.filing_date >= current_date - 370
      and pr.applicants is not null
      and normalized.identity_key is not null
      and char_length(normalized.identity_key) between 2 and 200;

    create index tmp_company_applicants_raw_idx on tmp_company_applicants(raw_name);

    create temporary table tmp_company_resolved on commit drop as
    select a.*,
           case
             when a.country_hint is not null then a.country_hint || ':' || a.identity_key
             else '*:' || a.identity_key
           end as resolution_key,
           case when a.country_hint is null then 0.800::numeric else 0.900::numeric end as resolution_confidence
    from tmp_company_applicants a;

    create index tmp_company_resolved_key_idx on tmp_company_resolved(resolution_key);

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

    create index tmp_company_map_raw_idx on tmp_company_map(raw_name);

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
    from tmp_company_source_ids sid
    join public.trademark_records tr
      on sid.entity_type = 'trademark'
     and tr.source = 'inapi'
     and tr.source_record_id = sid.source_record_id
    cross join lateral public.split_company_applicants(tr.solicitante) part
    join tmp_company_map m on m.raw_name = part.applicant
    where tr.fecha_presentacion >= current_date - 370
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
    from tmp_company_source_ids sid
    join public.patent_records pr
      on sid.entity_type = 'patent'
     and pr.source = 'inapi'
     and pr.source_record_id = sid.source_record_id
    cross join lateral public.split_company_applicants(pr.applicants) part
    join tmp_company_map m on m.raw_name = part.applicant
    where pr.filing_date >= current_date - 370
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

    select entity_type, source_record_id
      into v_next_entity, v_next_source_record_id
    from tmp_company_source_ids
    order by entity_type desc, source_record_id desc
    limit 1;

    v_done := v_source_records < v_limit;
  end if;

  if v_done then
    update public.intelligence_source_state
    set cursor = (
          coalesce(cursor, '{}'::jsonb)
          - 'company_activity_batch_entity'
          - 'company_activity_batch_source_record_id'
          - 'company_activity_batch_upper_at'
        ) || jsonb_build_object('company_activity_success_at', v_window_end),
        updated_at = now()
    where source_id = v_source_id;
  else
    update public.intelligence_source_state
    set cursor = coalesce(cursor, '{}'::jsonb) || jsonb_build_object(
          'company_activity_batch_upper_at', v_window_end,
          'company_activity_batch_entity', v_next_entity,
          'company_activity_batch_source_record_id', v_next_source_record_id
        ),
        updated_at = now()
    where source_id = v_source_id;
  end if;

  return jsonb_build_object(
    'since', p_since,
    'window_start', v_window_start,
    'window_end', v_window_end,
    'batch_limit', v_limit,
    'batch_records', v_source_records,
    'done', v_done,
    'next_entity', case when v_done then null else v_next_entity end,
    'next_source_record_id', case when v_done then null else v_next_source_record_id end,
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

revoke all on function public.refresh_company_ip_activity_from_sync_batch(timestamptz, integer) from public;
grant execute on function public.refresh_company_ip_activity_from_sync_batch(timestamptz, integer) to service_role;
