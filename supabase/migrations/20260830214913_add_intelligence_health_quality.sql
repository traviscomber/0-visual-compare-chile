create table if not exists public.intelligence_quality_runs (
  id uuid primary key default gen_random_uuid(),
  run_context text not null default 'daily',
  status text not null default 'running' check (status in ('running','completed','failed')),
  check_count integer not null default 0 check (check_count >= 0),
  warning_count integer not null default 0 check (warning_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.intelligence_quality_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.intelligence_quality_runs(id) on delete cascade,
  check_key text not null,
  category text not null check (category in ('freshness','traceability','identity','strategy','coverage')),
  severity text not null check (severity in ('info','warning','critical')),
  passed boolean not null,
  observed_value text,
  expected_value text,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  unique (run_id, check_key)
);

create index if not exists intelligence_quality_runs_started_idx on public.intelligence_quality_runs (started_at desc);
create index if not exists intelligence_quality_results_run_idx on public.intelligence_quality_results (run_id, passed, severity);

alter table public.intelligence_quality_runs enable row level security;
alter table public.intelligence_quality_results enable row level security;
revoke all on table public.intelligence_quality_runs from anon, authenticated;
revoke all on table public.intelligence_quality_results from anon, authenticated;
grant select, insert, update, delete on table public.intelligence_quality_runs to service_role;
grant select, insert, update, delete on table public.intelligence_quality_results to service_role;

drop policy if exists intelligence_quality_runs_service_all on public.intelligence_quality_runs;
create policy intelligence_quality_runs_service_all on public.intelligence_quality_runs for all to service_role using (true) with check (true);
drop policy if exists intelligence_quality_results_service_all on public.intelligence_quality_results;
create policy intelligence_quality_results_service_all on public.intelligence_quality_results for all to service_role using (true) with check (true);

create or replace function public.run_intelligence_quality_checks(p_context text default 'daily')
returns jsonb
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_run_id uuid;
  v_ts timestamptz;
  v_count bigint;
  v_expected bigint;
  v_failures integer;
  v_warnings integer;
  v_checks integer;
begin
  insert into public.intelligence_quality_runs(run_context, status)
  values (coalesce(nullif(trim(p_context), ''), 'daily'), 'running')
  returning id into v_run_id;

  select max(last_synced_at) into v_ts from public.patent_records where source = 'inapi';
  insert into public.intelligence_quality_results(run_id,check_key,category,severity,passed,observed_value,expected_value,message,details)
  values (v_run_id,'inapi_patent_freshness','freshness','critical',v_ts is not null and v_ts >= now() - interval '36 hours',coalesce(v_ts::text,'never'),'< 36 hours',case when v_ts is not null and v_ts >= now() - interval '36 hours' then 'Patentes INAPI sincronizadas dentro del SLA.' else 'Patentes INAPI fuera del SLA de sincronización.' end,jsonb_build_object('latest_sync_at',v_ts,'sla_hours',36));

  select max(last_synced_at) into v_ts from public.trademark_records where source = 'inapi';
  insert into public.intelligence_quality_results(run_id,check_key,category,severity,passed,observed_value,expected_value,message,details)
  values (v_run_id,'inapi_trademark_freshness','freshness','critical',v_ts is not null and v_ts >= now() - interval '36 hours',coalesce(v_ts::text,'never'),'< 36 hours',case when v_ts is not null and v_ts >= now() - interval '36 hours' then 'Marcas INAPI sincronizadas dentro del SLA.' else 'Marcas INAPI fuera del SLA de sincronización.' end,jsonb_build_object('latest_sync_at',v_ts,'sla_hours',36));

  select count(*) into v_count from public.intelligence_change_baselines
  where source_key='inapi_open_data' and (entity_type,dataset) in (('trademark','solicitudes-de-marcas'),('trademark','registros-de-marcas'),('patent','solicitudes-de-patentes'),('patent','registros-de-patentes'));
  v_expected := 4;
  insert into public.intelligence_quality_results(run_id,check_key,category,severity,passed,observed_value,expected_value,message,details)
  values (v_run_id,'inapi_change_baseline_coverage','coverage','warning',v_count=v_expected,v_count::text,v_expected::text,case when v_count=v_expected then 'Las cuatro líneas base INAPI están inicializadas.' else 'El motor de cambios todavía no tiene las cuatro líneas base INAPI.' end,jsonb_build_object('initialized',v_count,'expected',v_expected));

  select count(*) into v_count from public.intelligence_source_events
  where sync_run_id is null or source_record_id is null or btrim(source_record_id)='' or observed_at is null or after_snapshot is null;
  insert into public.intelligence_quality_results(run_id,check_key,category,severity,passed,observed_value,expected_value,message,details)
  values (v_run_id,'source_event_traceability','traceability','critical',v_count=0,v_count::text,'0','Todo evento estratégico debe conservar corrida, expediente, fecha observada y snapshot posterior.',jsonb_build_object('invalid_events',v_count));

  select count(*) into v_count from public.intelligence_strategic_changes c
  where (select count(*) from public.intelligence_strategic_change_evidence e where e.strategic_change_id=c.id) < 2;
  insert into public.intelligence_quality_results(run_id,check_key,category,severity,passed,observed_value,expected_value,message,details)
  values (v_run_id,'strategic_change_multi_evidence','strategy','critical',v_count=0,v_count::text,'0','Ningún cambio estratégico puede sostenerse en menos de dos evidencias observadas.',jsonb_build_object('single_or_zero_evidence_changes',v_count));

  select count(*) into v_count from public.intelligence_company_ip_activity a
  left join public.intelligence_company_identities i on i.id=a.identity_id where i.id is null;
  insert into public.intelligence_quality_results(run_id,check_key,category,severity,passed,observed_value,expected_value,message,details)
  values (v_run_id,'company_activity_identity_integrity','identity','critical',v_count=0,v_count::text,'0','Toda actividad IP debe resolver a una identidad corporativa existente.',jsonb_build_object('orphans',v_count));

  select count(*) into v_count from (select identity_id,entity_type,source_record_id,count(*) from public.intelligence_company_ip_activity group by identity_id,entity_type,source_record_id having count(*) > 1) d;
  insert into public.intelligence_quality_results(run_id,check_key,category,severity,passed,observed_value,expected_value,message,details)
  values (v_run_id,'company_activity_natural_key_uniqueness','identity','critical',v_count=0,v_count::text,'0','Una identidad no debe tener duplicado el mismo expediente y tipo de activo.',jsonb_build_object('duplicate_groups',v_count));

  select count(*) into v_count from public.intelligence_company_identities i
  where exists (select 1 from public.intelligence_company_ip_activity a where a.identity_id=i.id)
    and not exists (select 1 from public.intelligence_company_aliases al where al.identity_id=i.id);
  insert into public.intelligence_quality_results(run_id,check_key,category,severity,passed,observed_value,expected_value,message,details)
  values (v_run_id,'company_identity_alias_coverage','identity','warning',v_count=0,v_count::text,'0','Toda identidad con actividad debe conservar al menos un alias fuente.',jsonb_build_object('identities_without_alias',v_count));

  select count(*) into v_count from public.intelligence_sources s
  left join public.intelligence_source_state st on st.source_id=s.id
  where s.is_active and s.freshness_policy in ('diaria','semanal','mensual') and st.source_id is null;
  insert into public.intelligence_quality_results(run_id,check_key,category,severity,passed,observed_value,expected_value,message,details)
  values (v_run_id,'scheduled_source_health_coverage','coverage','warning',v_count=0,v_count::text,'0','Las fuentes con cadencia programada deben publicar estado operativo.',jsonb_build_object('scheduled_sources_without_state',v_count));

  select count(*)::int,count(*) filter (where not passed and severity='warning')::int,count(*) filter (where not passed and severity='critical')::int
    into v_checks,v_warnings,v_failures from public.intelligence_quality_results where run_id=v_run_id;

  update public.intelligence_quality_runs
  set status='completed',check_count=v_checks,warning_count=v_warnings,failure_count=v_failures,finished_at=now(),metadata=jsonb_build_object('grade',case when v_failures=0 and v_warnings=0 then 'A' when v_failures=0 then 'B' else 'C' end)
  where id=v_run_id;

  return jsonb_build_object('runId',v_run_id,'checks',v_checks,'warnings',v_warnings,'failures',v_failures,'grade',case when v_failures=0 and v_warnings=0 then 'A' when v_failures=0 then 'B' else 'C' end);
exception when others then
  if v_run_id is not null then update public.intelligence_quality_runs set status='failed',finished_at=now(),error_message=sqlerrm where id=v_run_id; end if;
  raise;
end;
$$;

revoke execute on function public.run_intelligence_quality_checks(text) from public, anon, authenticated;
grant execute on function public.run_intelligence_quality_checks(text) to service_role;
