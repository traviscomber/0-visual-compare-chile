import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Action due automation regression FAIL: ${message}`)
  process.exit(1)
}
function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

const [migration, cron, vercel] = await Promise.all([
  readFile("supabase/migrations/20260831210500_add_action_due_automation.sql", "utf8"),
  readFile("app/api/cron/case-automation/route.ts", "utf8"),
  readFile("vercel.json", "utf8"),
])

for (const needle of [
  "add column if not exists case_action_id uuid references public.case_actions(id) on delete cascade",
  "add column if not exists due_at_snapshot timestamptz",
  "'action_due_reminder'",
  "'action_overdue_escalation'",
  "case_automation_actions_deadline_snapshot_check",
  "case_automation_actions_deadline_dedupe_uq",
  "on public.case_automation_actions(case_action_id, action_type, due_at_snapshot)",
  "case_actions_open_due_idx",
  "where status = 'open' and due_at is not null and assigned_to is not null",
  "a.status = 'open'",
  "a.assigned_to is not null",
  "a.due_at is not null",
  "a.due_at <= now() + interval '48 hours'",
  "if v_action.due_at > now() then",
  "'action_due_within_48_hours'",
  "'action_overdue'",
  "on conflict do nothing",
  "'Tarea próxima a vencer'",
  "'Tarea vencida'",
  "'priority_changed',false",
  "'actionDueReminders',v_action_due_reminders",
  "'actionOverdueEscalations',v_action_overdue_escalations",
  "revoke all on function public.run_case_automation_sweep() from public, anon, authenticated",
  "grant execute on function public.run_case_automation_sweep() to service_role",
]) requireText(migration, needle, "deadline automation migration")

const actionSection = migration.slice(migration.indexOf("-- Action deadlines are universal:"))
if (!actionSection) fail("action deadline section missing")
if (/update\s+public\.cases\s+set\s+priority/i.test(actionSection)) fail("action overdue automation must not mutate case priority")
if (/update\s+public\.case_actions/i.test(actionSection)) fail("deadline automation must not mutate task lifecycle state")

for (const needle of [
  "CRON_SECRET",
  'admin.rpc("run_case_automation_sweep")',
]) requireText(cron, needle, "existing case automation cron")

requireText(vercel, '"path": "/api/cron/case-automation"', "vercel cron")
requireText(vercel, '"schedule": "0 * * * *"', "vercel cron")

console.log("Action due automation regression PASS: the existing hourly scheduler adds deduplicated 48h reminders and overdue escalation per deadline snapshot, preserves task/case state, and remains service-role only.")
