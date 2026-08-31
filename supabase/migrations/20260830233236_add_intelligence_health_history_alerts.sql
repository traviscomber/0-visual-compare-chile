alter table public.user_notifications
  drop constraint if exists user_notifications_kind_check;

alter table public.user_notifications
  add constraint user_notifications_kind_check
  check (kind = any (array[
    'review_requested'::text,
    'review_approved'::text,
    'review_changes_requested'::text,
    'mention'::text,
    'action_assigned'::text,
    'review_reminder'::text,
    'review_deadline_extended'::text,
    'automation_reminder'::text,
    'automation_escalation'::text,
    'source_health_alert'::text,
    'source_health_resolved'::text
  ]));

create table public.intelligence_source_health_history (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.intelligence_sources(id) on delete cascade,
  run_id uuid references public.intelligence_ingestion_runs(id) on delete set null,
  observed_at timestamptz not null default now(),
  status text not null check (status in ('operational','degraded','stale','initializing','on_demand','inactive')),
  last_success_at timestamptz,
  last_attempt_at timestamptz,
  age_hours numeric(12,2),
  sla_hours numeric(12,2),
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  circuit_state text,
  last_error text,
  metadata jsonb not null default '{}'::jsonb
);

create index intelligence_source_health_history_source_observed_idx
  on public.intelligence_source_health_history(source_id, observed_at desc);

create index intelligence_source_health_history_status_observed_idx
  on public.intelligence_source_health_history(status, observed_at desc);

alter table public.intelligence_source_health_history enable row level security;
revoke all on public.intelligence_source_health_history from public, anon, authenticated;
grant select, insert, update, delete on public.intelligence_source_health_history to service_role;

create table public.intelligence_source_alerts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.intelligence_sources(id) on delete cascade,
  alert_type text not null check (alert_type in ('freshness_sla')),
  status text not null default 'open' check (status in ('open','resolved')),
  severity text not null default 'warning' check (severity in ('warning','critical')),
  opened_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  run_id uuid references public.intelligence_ingestion_runs(id) on delete set null,
  details jsonb not null default '{}'::jsonb
);

create unique index intelligence_source_alerts_one_open_idx
  on public.intelligence_source_alerts(source_id, alert_type)
  where status = 'open';

create index intelligence_source_alerts_status_seen_idx
  on public.intelligence_source_alerts(status, last_seen_at desc);

alter table public.intelligence_source_alerts enable row level security;
revoke all on public.intelligence_source_alerts from public, anon, authenticated;
grant select, insert, update, delete on public.intelligence_source_alerts to service_role;

create or replace function public.run_intelligence_health_sweep(p_context text default 'scheduled')
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
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
begin
  for r in
    select
      s.id as source_id,
      s.source_key,
      s.name as source_name,
      s.is_active,
      s.freshness_policy,
      st.last_success_at,
      st.last_attempt_at,
      coalesce(st.consecutive_failures, 0) as consecutive_failures,
      st.circuit_state,
      st.last_error,
      latest.id as latest_run_id,
      latest.status as latest_run_status
    from public.intelligence_sources s
    left join public.intelligence_source_state st on st.source_id = s.id
    left join lateral (
      select ir.id, ir.status
      from public.intelligence_ingestion_runs ir
      where ir.source_id = s.id
      order by ir.started_at desc
      limit 1
    ) latest on true
    order by s.source_key
  loop
    v_sla_hours := case r.freshness_policy
      when 'diaria' then 36
      when 'semanal' then 216
      when 'mensual' then 960
      else null
    end;

    v_age_hours := case
      when r.last_success_at is null then null
      else round((extract(epoch from (now() - r.last_success_at)) / 3600.0)::numeric, 2)
    end;

    v_status := case
      when not r.is_active then 'inactive'
      when r.freshness_policy = 'bajo_demanda' then 'on_demand'
      when r.last_success_at is null then 'initializing'
      when r.circuit_state = 'open' or r.consecutive_failures > 0 or r.last_error is not null then 'degraded'
      when v_sla_hours is not null and v_age_hours > v_sla_hours then 'stale'
      else 'operational'
    end;

    insert into public.intelligence_source_health_history (
      source_id, run_id, status, last_success_at, last_attempt_at, age_hours,
      sla_hours, consecutive_failures, circuit_state, last_error, metadata
    ) values (
      r.source_id,
      r.latest_run_id,
      v_status,
      r.last_success_at,
      r.last_attempt_at,
      v_age_hours,
      v_sla_hours,
      greatest(0, r.consecutive_failures),
      r.circuit_state,
      r.last_error,
      jsonb_build_object(
        'context', coalesce(nullif(trim(p_context), ''), 'scheduled'),
        'source_key', r.source_key,
        'latest_run_status', r.latest_run_status
      )
    );
    v_snapshots := v_snapshots + 1;

    if r.is_active
      and v_sla_hours is not null
      and v_age_hours is not null
      and v_age_hours > v_sla_hours
    then
      select a.id into v_existing_alert
      from public.intelligence_source_alerts a
      where a.source_id = r.source_id
        and a.alert_type = 'freshness_sla'
        and a.status = 'open'
      limit 1;

      if v_existing_alert is null then
        insert into public.intelligence_source_alerts (
          source_id, alert_type, status, severity, run_id, details
        ) values (
          r.source_id,
          'freshness_sla',
          'open',
          case when v_age_hours > v_sla_hours * 2 then 'critical' else 'warning' end,
          r.latest_run_id,
          jsonb_build_object(
            'source_key', r.source_key,
            'source_name', r.source_name,
            'age_hours', v_age_hours,
            'sla_hours', v_sla_hours,
            'freshness_policy', r.freshness_policy
          )
        ) returning id into v_existing_alert;

        insert into public.user_notifications (
          user_id, actor_id, case_id, kind, title, body, href, created_at
        )
        select
          p.id,
          null,
          null,
          'source_health_alert',
          'Fuente fuera de SLA',
          left(r.source_name || ' lleva ' || v_age_hours || ' h desde su último éxito; SLA ' || v_sla_hours || ' h.', 500),
          '/fuentes',
          now()
        from public.profiles p
        where p.role = 'admin';

        v_opened := v_opened + 1;
      else
        update public.intelligence_source_alerts
        set last_seen_at = now(),
            severity = case when v_age_hours > v_sla_hours * 2 then 'critical' else severity end,
            run_id = r.latest_run_id,
            details = jsonb_build_object(
              'source_key', r.source_key,
              'source_name', r.source_name,
              'age_hours', v_age_hours,
              'sla_hours', v_sla_hours,
              'freshness_policy', r.freshness_policy
            )
        where id = v_existing_alert;
      end if;
    else
      update public.intelligence_source_alerts
      set status = 'resolved',
          resolved_at = now(),
          last_seen_at = now(),
          run_id = r.latest_run_id,
          details = details || jsonb_build_object('resolved_context', coalesce(nullif(trim(p_context), ''), 'scheduled'))
      where source_id = r.source_id
        and alert_type = 'freshness_sla'
        and status = 'open';

      get diagnostics v_resolved_count = row_count;
      if v_resolved_count > 0 then
        insert into public.user_notifications (
          user_id, actor_id, case_id, kind, title, body, href, created_at
        )
        select
          p.id,
          null,
          null,
          'source_health_resolved',
          'Freshness recuperada',
          left(r.source_name || ' volvió a estar dentro de su SLA de freshness.', 500),
          '/fuentes',
          now()
        from public.profiles p
        where p.role = 'admin';
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
$$;

revoke all on function public.run_intelligence_health_sweep(text) from public, anon, authenticated;
grant execute on function public.run_intelligence_health_sweep(text) to service_role;
