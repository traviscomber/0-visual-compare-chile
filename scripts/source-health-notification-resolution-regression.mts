import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Source health notification resolution regression FAIL: ${message}`)
  process.exit(1)
}

const migration = await readFile("supabase/migrations/20260906023500_resolve_source_health_notifications.sql", "utf8")

for (const needle of [
  "resolve_source_health_notification_on_recovery",
  "old.status = 'open'",
  "new.status = 'resolved'",
  "new.alert_type = 'freshness_sla'",
  "n.kind = 'source_health_alert'",
  "n.read_at is null",
  "n.href = '/fuentes'",
  "n.title = 'Fuente fuera de SLA'",
  "n.body like v_source_name || ' lleva % desde su último éxito; SLA %'",
  "n.created_at >= new.opened_at - interval '1 minute'",
  "n.created_at <= coalesce(new.resolved_at, now()) + interval '1 minute'",
  "a.alert_type = 'freshness_sla'",
  "a.status = 'resolved'",
  "a.resolved_at is not null",
  "n.body like s.name || ' lleva % desde su último éxito; SLA %'",
  "create trigger intelligence_source_alert_notification_resolution",
]) {
  if (!migration.includes(needle)) fail(`missing lifecycle invariant: ${needle}`)
}

for (const forbidden of [
  "where n.kind = 'source_health_alert';",
  "set read_at = now() where kind = 'source_health_alert'",
  "n.kind in ('source_health_alert','source_health_resolved')",
]) {
  if (migration.includes(forbidden)) fail(`notification cleanup is too broad: ${forbidden}`)
}

console.log("Source health notification resolution regression PASS: only resolved freshness incidents consume their matching unread outage notification; recovery notices and open incidents remain untouched.")
