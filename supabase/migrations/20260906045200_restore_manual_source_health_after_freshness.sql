-- A later freshness-contract migration can replace this function. Keep manual-only
-- reference sources distinguishable from genuinely inactive automated connectors.
create or replace function public.run_intelligence_health_sweep(p_context text default 'scheduled')
returns jsonb
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  r record;
  v_status text;
  v_sla_hours numeric;
  v_age_hours numeric;
  v_existing_alert uuid;
  v_resolved_count integer;
  v_snapshots integer := 0;
  v_opened integer := 0;
  v_resolved integer := 0;
  v_policy text;
begin
  for r in
    select s.id as source_id, s.source_key, s.name as source_name, s.is_active, s.freshness_policy, s.metadata,
      st.last_success_at, st.last_attempt_at, coalesce(st.consecutive_failures, 0) as consecutive_failures,
      st.circuit_state, st.last_error, latest.id as latest_run_id, latest.status as latest_run_status
    from public.intelligence_sources s
    left join public.intelligence_source_state st on st.source_id = s.id
    left join lateral (
      select ir.id, ir.status from public.intelligence_ingestion_runs ir
      where ir.source_id = s.id order by ir.started_at desc limit 1
    ) latest on true
    order by s.source_key
  loop
    v_policy := lower(regexp_replace(trim(coalesce(r.freshness_policy, '')), '[-[:space:]]+', '_', 'g'));
    v_sla_hours := case v_policy when 'cada_15_min' then 1 when 'diaria' then 36 when 'semanal' then 216 when 'mensual' then 960 else null end;
    v_age_hours := case when r.last_success_at is null then null else round((extract(epoch from (now() - r.last_success_at)) / 3600.0)::numeric, 2) end;
    v_status := case
      when not r.is_active and coalesce(r.metadata->>'automation_policy', '') = 'manual_only' then 'manual'
      when not r.is_active then 'inactive'
      when v_policy = 'bajo_demanda' or v_policy = 'on_demand' or v_policy like 'on_demand;%' then 'on_demand'
      when r.last_success_at is null then 'initializing'
      when r.circuit_state = 'open' or r.consecutive_failures > 0 or r.last_error is not null then 'degraded'
      when v_sla_hours is not null and v_age_hours > v_sla_hours then 'stale'
      else 'operational'
    end;

    insert into public.intelligence_source_health_history (
      source_id, run_id, status, last_success_at, last_attempt_at, age_hours, sla_hours,
      consecutive_failures, circuit_state, last_error, metadata
    ) values (
      r.source_id, r.latest_run_id, v_status, r.last_success_at, r.last_attempt_at, v_age_hours, v_sla_hours,
      greatest(0, r.consecutive_failures), r.circuit_state, r.last_error,
      jsonb_build_object('context', coalesce(nullif(trim(p_context), ''), 'scheduled'), 'source_key', r.source_key,
        'latest_run_status', r.latest_run_status, 'freshness_policy', r.freshness_policy)
    );
    v_snapshots := v_snapshots + 1;

    if r.is_active and v_sla_hours is not null and v_age_hours is not null and v_age_hours > v_sla_hours then
      select a.id into v_existing_alert from public.intelligence_source_alerts a
      where a.source_id = r.source_id and a.alert_type = 'freshness_sla' and a.status = 'open' limit 1;
      if v_existing_alert is null then
        insert into public.intelligence_source_alerts (source_id, alert_type, status, severity, run_id, details)
        values (r.source_id, 'freshness_sla', 'open', case when v_age_hours > v_sla_hours * 2 then 'critical' else 'warning' end,
          r.latest_run_id, jsonb_build_object('source_key', r.source_key, 'source_name', r.source_name, 'age_hours', v_age_hours,
          'sla_hours', v_sla_hours, 'freshness_policy', r.freshness_policy)) returning id into v_existing_alert;
        insert into public.user_notifications (user_id, actor_id, case_id, kind, title, body, href, created_at)
        select p.id, null, null, 'source_health_alert', 'Fuente fuera de SLA',
          left(r.source_name || ' lleva ' || v_age_hours || ' h desde su último éxito; SLA ' || v_sla_hours || ' h.', 500), '/fuentes', now()
        from public.profiles p where p.role = 'admin';
        v_opened := v_opened + 1;
      else
        update public.intelligence_source_alerts
        set last_seen_at = now(), severity = case when v_age_hours > v_sla_hours * 2 then 'critical' else severity end,
            run_id = r.latest_run_id,
            details = jsonb_build_object('source_key', r.source_key, 'source_name', r.source_name, 'age_hours', v_age_hours,
              'sla_hours', v_sla_hours, 'freshness_policy', r.freshness_policy)
        where id = v_existing_alert;
      end if;
    else
      update public.intelligence_source_alerts
      set status = 'resolved', resolved_at = now(), last_seen_at = now(), run_id = r.latest_run_id,
          details = details || jsonb_build_object('resolved_context', coalesce(nullif(trim(p_context), ''), 'scheduled'))
      where source_id = r.source_id and alert_type = 'freshness_sla' and status = 'open';
      get diagnostics v_resolved_count = row_count;
      if v_resolved_count > 0 then
        insert into public.user_notifications (user_id, actor_id, case_id, kind, title, body, href, created_at)
        select p.id, null, null, 'source_health_resolved', 'Freshness recuperada',
          left(r.source_name || ' volvió a estar dentro de su SLA de freshness.', 500), '/fuentes', now()
        from public.profiles p where p.role = 'admin';
        v_resolved := v_resolved + v_resolved_count;
      end if;
    end if;
  end loop;
  return jsonb_build_object(
    'ok', true,
    'context', coalesce(nullif(trim(p_context), ''), 'scheduled'),
    'snapshots', v_snapshots,
    'alertsOpened', v_opened,
    'alertsResolved', v_resolved,
    'ranAt', now()
  );
end;
$function$;
