create or replace function public.resolve_source_health_notification_on_recovery()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_source_name text;
begin
  if old.status = 'open'
    and new.status = 'resolved'
    and new.alert_type = 'freshness_sla'
  then
    select s.name
    into v_source_name
    from public.intelligence_sources s
    where s.id = new.source_id;

    if v_source_name is not null then
      update public.user_notifications n
      set read_at = coalesce(n.read_at, coalesce(new.resolved_at, now()))
      where n.kind = 'source_health_alert'
        and n.read_at is null
        and n.href = '/fuentes'
        and n.title = 'Fuente fuera de SLA'
        and n.body like v_source_name || ' lleva % desde su último éxito; SLA %'
        and n.created_at >= new.opened_at - interval '1 minute'
        and n.created_at <= coalesce(new.resolved_at, now()) + interval '1 minute';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists intelligence_source_alert_notification_resolution
  on public.intelligence_source_alerts;

create trigger intelligence_source_alert_notification_resolution
after update of status on public.intelligence_source_alerts
for each row
when (old.status is distinct from new.status)
execute function public.resolve_source_health_notification_on_recovery();

update public.user_notifications n
set read_at = coalesce(n.read_at, coalesce(a.resolved_at, now()))
from public.intelligence_source_alerts a
join public.intelligence_sources s on s.id = a.source_id
where a.alert_type = 'freshness_sla'
  and a.status = 'resolved'
  and a.resolved_at is not null
  and n.kind = 'source_health_alert'
  and n.read_at is null
  and n.href = '/fuentes'
  and n.title = 'Fuente fuera de SLA'
  and n.body like s.name || ' lleva % desde su último éxito; SLA %'
  and n.created_at >= a.opened_at - interval '1 minute'
  and n.created_at <= a.resolved_at + interval '1 minute';
