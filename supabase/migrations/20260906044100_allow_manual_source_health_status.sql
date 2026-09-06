alter table public.intelligence_source_health_history
  drop constraint if exists intelligence_source_health_history_status_check;

alter table public.intelligence_source_health_history
  add constraint intelligence_source_health_history_status_check
  check (status = any (array[
    'operational'::text,
    'degraded'::text,
    'stale'::text,
    'initializing'::text,
    'on_demand'::text,
    'manual'::text,
    'inactive'::text
  ]));
