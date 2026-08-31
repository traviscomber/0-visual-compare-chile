create table public.intelligence_company_identity_operations (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null check (operation_type in ('merge','split_alias')),
  actor_id uuid not null references auth.users(id) on delete restrict,
  source_identity_id uuid not null,
  target_identity_id uuid,
  alias_id uuid,
  reason text not null check (char_length(trim(reason)) between 3 and 1000),
  status text not null default 'completed' check (status in ('completed')),
  before_snapshot jsonb not null default '{}'::jsonb,
  after_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index intelligence_company_identity_operations_actor_created_idx
  on public.intelligence_company_identity_operations(actor_id, created_at desc);
create index intelligence_company_identity_operations_source_created_idx
  on public.intelligence_company_identity_operations(source_identity_id, created_at desc);
create index intelligence_company_identity_operations_target_created_idx
  on public.intelligence_company_identity_operations(target_identity_id, created_at desc)
  where target_identity_id is not null;

alter table public.intelligence_company_identity_operations enable row level security;
revoke all on public.intelligence_company_identity_operations from public, anon, authenticated;
grant select, insert, update, delete on public.intelligence_company_identity_operations to service_role;

create or replace function public.merge_company_identities_manual(
  p_actor_id uuid,
  p_source_identity_id uuid,
  p_target_identity_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_source public.intelligence_company_identities%rowtype;
  v_target public.intelligence_company_identities%rowtype;
  v_operation_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_aliases integer;
  v_activity integer;
  v_links integer;
  v_reviews integer;
begin
  if p_actor_id is null or not exists (select 1 from public.profiles p where p.id=p_actor_id and p.role='admin') then
    raise exception 'admin_required';
  end if;
  if p_source_identity_id is null or p_target_identity_id is null or p_source_identity_id=p_target_identity_id then
    raise exception 'invalid_identity_pair';
  end if;
  if nullif(trim(p_reason),'') is null or char_length(trim(p_reason)) < 3 then
    raise exception 'reason_required';
  end if;

  select * into v_source from public.intelligence_company_identities where id=p_source_identity_id for update;
  if not found then raise exception 'source_identity_not_found'; end if;
  select * into v_target from public.intelligence_company_identities where id=p_target_identity_id for update;
  if not found then raise exception 'target_identity_not_found'; end if;

  if exists (select 1 from public.intelligence_portfolio_bindings b where b.identity_id=p_source_identity_id) then
    raise exception 'source_has_portfolio_binding';
  end if;
  if exists (
    select 1 from public.intelligence_company_relationships r
    where r.from_identity_id=p_source_identity_id or r.to_identity_id=p_source_identity_id
  ) then
    raise exception 'source_has_corporate_relationships';
  end if;

  select jsonb_build_object(
    'source', jsonb_build_object(
      'id',v_source.id,'canonical_name',v_source.canonical_name,'country',v_source.country,'resolution_key',v_source.resolution_key,
      'aliases',(select count(*) from public.intelligence_company_aliases where identity_id=p_source_identity_id),
      'activity',(select count(*) from public.intelligence_company_ip_activity where identity_id=p_source_identity_id),
      'entity_links',(select count(*) from public.intelligence_company_entity_links where identity_id=p_source_identity_id),
      'reviews',(select count(*) from public.intelligence_company_identity_reviews where identity_id=p_source_identity_id)
    ),
    'target', jsonb_build_object(
      'id',v_target.id,'canonical_name',v_target.canonical_name,'country',v_target.country,'resolution_key',v_target.resolution_key,
      'aliases',(select count(*) from public.intelligence_company_aliases where identity_id=p_target_identity_id),
      'activity',(select count(*) from public.intelligence_company_ip_activity where identity_id=p_target_identity_id),
      'entity_links',(select count(*) from public.intelligence_company_entity_links where identity_id=p_target_identity_id)
    )
  ) into v_before;

  insert into public.intelligence_company_aliases (
    identity_id,raw_name,alias_key,country_hint,source_scope,resolution_method,confidence,
    first_seen_at,last_seen_at,metadata,created_at,updated_at
  )
  select p_target_identity_id,a.raw_name,a.alias_key,a.country_hint,a.source_scope,'verified_manual',greatest(a.confidence,0.950),
         a.first_seen_at,a.last_seen_at,a.metadata || jsonb_build_object('manual_merge_from',p_source_identity_id::text),a.created_at,now()
  from public.intelligence_company_aliases a
  where a.identity_id=p_source_identity_id
  on conflict (identity_id,source_scope,raw_name) do update set
    confidence=greatest(public.intelligence_company_aliases.confidence,excluded.confidence),
    first_seen_at=least(public.intelligence_company_aliases.first_seen_at,excluded.first_seen_at),
    last_seen_at=greatest(public.intelligence_company_aliases.last_seen_at,excluded.last_seen_at),
    metadata=public.intelligence_company_aliases.metadata || excluded.metadata,
    updated_at=now();
  get diagnostics v_aliases=row_count;
  delete from public.intelligence_company_aliases where identity_id=p_source_identity_id;

  insert into public.intelligence_company_ip_activity (
    identity_id,entity_type,source_key,source_record_id,applicant_raw,title,filing_date,status,
    classification_codes,source_url,metadata,first_seen_at,last_seen_at,created_at,updated_at
  )
  select p_target_identity_id,a.entity_type,a.source_key,a.source_record_id,a.applicant_raw,a.title,a.filing_date,a.status,
         a.classification_codes,a.source_url,a.metadata || jsonb_build_object('manual_merge_from',p_source_identity_id::text),
         a.first_seen_at,a.last_seen_at,a.created_at,now()
  from public.intelligence_company_ip_activity a
  where a.identity_id=p_source_identity_id
  on conflict (identity_id,entity_type,source_record_id) do update set
    first_seen_at=least(public.intelligence_company_ip_activity.first_seen_at,excluded.first_seen_at),
    last_seen_at=greatest(public.intelligence_company_ip_activity.last_seen_at,excluded.last_seen_at),
    metadata=public.intelligence_company_ip_activity.metadata || excluded.metadata,
    updated_at=now();
  get diagnostics v_activity=row_count;
  delete from public.intelligence_company_ip_activity where identity_id=p_source_identity_id;

  insert into public.intelligence_company_entity_links (
    identity_id,entity_id,link_type,confidence,source_scope,metadata,created_at,updated_at
  )
  select p_target_identity_id,l.entity_id,l.link_type,greatest(l.confidence,0.950),l.source_scope,
         l.metadata || jsonb_build_object('manual_merge_from',p_source_identity_id::text),l.created_at,now()
  from public.intelligence_company_entity_links l
  where l.identity_id=p_source_identity_id
  on conflict (identity_id,entity_id,link_type) do update set
    confidence=greatest(public.intelligence_company_entity_links.confidence,excluded.confidence),
    metadata=public.intelligence_company_entity_links.metadata || excluded.metadata,
    updated_at=now();
  get diagnostics v_links=row_count;
  delete from public.intelligence_company_entity_links where identity_id=p_source_identity_id;

  update public.intelligence_company_identity_reviews
  set status=case when status='pending' then 'cancelled' else status end,
      decision=decision || jsonb_build_object('manual_merge_from',p_source_identity_id::text,'manual_merge_to',p_target_identity_id::text,'reason',trim(p_reason)),
      reviewed_at=case when status='pending' then now() else reviewed_at end,
      reviewed_by=case when status='pending' then p_actor_id else reviewed_by end,
      identity_id=p_target_identity_id,
      updated_at=now()
  where identity_id=p_source_identity_id;
  get diagnostics v_reviews=row_count;

  update public.intelligence_company_identities
  set resolution_confidence=greatest(resolution_confidence,0.950),
      metadata=metadata || jsonb_build_object('manual_merge_last_source',p_source_identity_id::text,'manual_merge_at',now(),'manual_merge_reason',trim(p_reason)),
      last_seen_at=greatest(last_seen_at,v_source.last_seen_at),
      updated_at=now()
  where id=p_target_identity_id;

  delete from public.intelligence_company_identities where id=p_source_identity_id;

  select jsonb_build_object(
    'target', jsonb_build_object(
      'id',p_target_identity_id,
      'aliases',(select count(*) from public.intelligence_company_aliases where identity_id=p_target_identity_id),
      'activity',(select count(*) from public.intelligence_company_ip_activity where identity_id=p_target_identity_id),
      'entity_links',(select count(*) from public.intelligence_company_entity_links where identity_id=p_target_identity_id),
      'reviews',(select count(*) from public.intelligence_company_identity_reviews where identity_id=p_target_identity_id)
    ),
    'moved',jsonb_build_object('aliases',v_aliases,'activity',v_activity,'entity_links',v_links,'reviews',v_reviews)
  ) into v_after;

  insert into public.intelligence_company_identity_operations (
    operation_type,actor_id,source_identity_id,target_identity_id,reason,before_snapshot,after_snapshot,metadata
  ) values (
    'merge',p_actor_id,p_source_identity_id,p_target_identity_id,trim(p_reason),v_before,v_after,
    jsonb_build_object('guardrails',array['no_portfolio_binding','no_corporate_relationships'])
  ) returning id into v_operation_id;

  return jsonb_build_object('ok',true,'operationId',v_operation_id,'targetIdentityId',p_target_identity_id,'moved',v_after->'moved');
end;
$$;

revoke all on function public.merge_company_identities_manual(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.merge_company_identities_manual(uuid,uuid,uuid,text) to service_role;

create or replace function public.split_company_alias_manual(
  p_actor_id uuid,
  p_alias_id uuid,
  p_canonical_name text,
  p_country text,
  p_reason text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, extensions, pg_temp
as $$
declare
  v_alias public.intelligence_company_aliases%rowtype;
  v_source public.intelligence_company_identities%rowtype;
  v_target_id uuid;
  v_identity_key text;
  v_resolution_key text;
  v_operation_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_activity integer;
begin
  if p_actor_id is null or not exists (select 1 from public.profiles p where p.id=p_actor_id and p.role='admin') then
    raise exception 'admin_required';
  end if;
  if nullif(trim(p_reason),'') is null or char_length(trim(p_reason)) < 3 then
    raise exception 'reason_required';
  end if;
  if nullif(trim(p_country),'') is null then raise exception 'country_required'; end if;
  if nullif(trim(p_canonical_name),'') is null then raise exception 'canonical_name_required'; end if;

  select * into v_alias from public.intelligence_company_aliases where id=p_alias_id for update;
  if not found then raise exception 'alias_not_found'; end if;
  select * into v_source from public.intelligence_company_identities where id=v_alias.identity_id for update;
  if not found then raise exception 'source_identity_not_found'; end if;

  v_identity_key := public.normalize_company_identity(p_canonical_name);
  if v_identity_key is null then raise exception 'invalid_canonical_name'; end if;
  v_resolution_key := upper(trim(p_country)) || ':' || v_identity_key;

  select id into v_target_id
  from public.intelligence_company_identities
  where resolution_key=v_resolution_key
  for update;

  if v_target_id is null then
    insert into public.intelligence_company_identities (
      resolution_key,identity_key,canonical_name,country,resolution_confidence,metadata,first_seen_at,last_seen_at,updated_at
    ) values (
      v_resolution_key,v_identity_key,trim(p_canonical_name),upper(trim(p_country)),0.950,
      jsonb_build_object('resolution','verified_manual_split','manual_split_from',v_source.id::text,'review_required',false),
      v_alias.first_seen_at,v_alias.last_seen_at,now()
    ) returning id into v_target_id;
  end if;

  if v_target_id=v_source.id then raise exception 'split_target_equals_source'; end if;

  select jsonb_build_object(
    'sourceIdentityId',v_source.id,
    'sourceCanonicalName',v_source.canonical_name,
    'aliasId',v_alias.id,
    'rawName',v_alias.raw_name,
    'activityForAlias',(select count(*) from public.intelligence_company_ip_activity where identity_id=v_source.id and applicant_raw=v_alias.raw_name)
  ) into v_before;

  insert into public.intelligence_company_aliases (
    identity_id,raw_name,alias_key,country_hint,source_scope,resolution_method,confidence,
    first_seen_at,last_seen_at,metadata,created_at,updated_at
  ) values (
    v_target_id,v_alias.raw_name,v_alias.alias_key,upper(trim(p_country)),v_alias.source_scope,'verified_manual',1.000,
    v_alias.first_seen_at,v_alias.last_seen_at,v_alias.metadata || jsonb_build_object('manual_split_from',v_source.id::text),v_alias.created_at,now()
  )
  on conflict (identity_id,source_scope,raw_name) do update set
    confidence=1.000,
    country_hint=excluded.country_hint,
    resolution_method='verified_manual',
    first_seen_at=least(public.intelligence_company_aliases.first_seen_at,excluded.first_seen_at),
    last_seen_at=greatest(public.intelligence_company_aliases.last_seen_at,excluded.last_seen_at),
    metadata=public.intelligence_company_aliases.metadata || excluded.metadata,
    updated_at=now();

  insert into public.intelligence_company_ip_activity (
    identity_id,entity_type,source_key,source_record_id,applicant_raw,title,filing_date,status,
    classification_codes,source_url,metadata,first_seen_at,last_seen_at,created_at,updated_at
  )
  select v_target_id,a.entity_type,a.source_key,a.source_record_id,a.applicant_raw,a.title,a.filing_date,a.status,
         a.classification_codes,a.source_url,a.metadata || jsonb_build_object('manual_split_from',v_source.id::text),
         a.first_seen_at,a.last_seen_at,a.created_at,now()
  from public.intelligence_company_ip_activity a
  where a.identity_id=v_source.id and a.applicant_raw=v_alias.raw_name
  on conflict (identity_id,entity_type,source_record_id) do update set
    first_seen_at=least(public.intelligence_company_ip_activity.first_seen_at,excluded.first_seen_at),
    last_seen_at=greatest(public.intelligence_company_ip_activity.last_seen_at,excluded.last_seen_at),
    metadata=public.intelligence_company_ip_activity.metadata || excluded.metadata,
    updated_at=now();
  get diagnostics v_activity=row_count;

  delete from public.intelligence_company_ip_activity
  where identity_id=v_source.id and applicant_raw=v_alias.raw_name;
  delete from public.intelligence_company_aliases where id=v_alias.id;

  update public.intelligence_company_identity_reviews
  set identity_id=v_target_id,
      resolution_key=v_resolution_key,
      status=case when status='pending' then 'approved' else status end,
      decision=decision || jsonb_build_object('manual_split_from',v_source.id::text,'manual_split_to',v_target_id::text,'reason',trim(p_reason)),
      reviewed_at=case when status='pending' then now() else reviewed_at end,
      reviewed_by=case when status='pending' then p_actor_id else reviewed_by end,
      updated_at=now()
  where identity_id=v_source.id and raw_name=v_alias.raw_name;

  update public.intelligence_company_identities
  set metadata=metadata || jsonb_build_object('manual_split_last_target',v_target_id::text,'manual_split_at',now(),'manual_split_reason',trim(p_reason)),
      updated_at=now()
  where id=v_source.id;

  if not exists (select 1 from public.intelligence_company_aliases where identity_id=v_source.id)
     and not exists (select 1 from public.intelligence_company_ip_activity where identity_id=v_source.id)
     and not exists (select 1 from public.intelligence_company_entity_links where identity_id=v_source.id)
     and not exists (select 1 from public.intelligence_company_identity_reviews where identity_id=v_source.id)
     and not exists (select 1 from public.intelligence_portfolio_bindings where identity_id=v_source.id)
     and not exists (select 1 from public.intelligence_company_relationships where from_identity_id=v_source.id or to_identity_id=v_source.id)
  then
    delete from public.intelligence_company_identities where id=v_source.id;
  end if;

  select jsonb_build_object(
    'targetIdentityId',v_target_id,
    'targetResolutionKey',v_resolution_key,
    'rawName',v_alias.raw_name,
    'activityMoved',v_activity,
    'sourceRetained',exists(select 1 from public.intelligence_company_identities where id=v_source.id)
  ) into v_after;

  insert into public.intelligence_company_identity_operations (
    operation_type,actor_id,source_identity_id,target_identity_id,alias_id,reason,before_snapshot,after_snapshot,metadata
  ) values (
    'split_alias',p_actor_id,v_source.id,v_target_id,p_alias_id,trim(p_reason),v_before,v_after,
    jsonb_build_object('guardrails',array['explicit_country','exact_applicant_raw_activity_move'])
  ) returning id into v_operation_id;

  return jsonb_build_object('ok',true,'operationId',v_operation_id,'targetIdentityId',v_target_id,'activityMoved',v_activity);
end;
$$;

revoke all on function public.split_company_alias_manual(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.split_company_alias_manual(uuid,uuid,text,text,text) to service_role;
