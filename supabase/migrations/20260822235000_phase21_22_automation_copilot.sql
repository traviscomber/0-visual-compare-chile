create table if not exists public.case_automation_policy (
  case_id uuid primary key references public.cases(id) on delete cascade,
  enabled boolean not null default false,
  auto_remind boolean not null default true,
  auto_raise_priority boolean not null default false,
  remind_before_hours integer not null default 24 check (remind_before_hours between 1 and 168),
  escalate_before_hours integer not null default 12 check (escalate_before_hours between 1 and 168),
  cooldown_hours integer not null default 12 check (cooldown_hours between 1 and 168),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.case_automation_policy enable row level security;

drop policy if exists case_automation_policy_select on public.case_automation_policy;
create policy case_automation_policy_select on public.case_automation_policy for select to authenticated
using (public.case_access_role(case_id, auth.uid()) is not null);

drop policy if exists case_automation_policy_insert on public.case_automation_policy;
create policy case_automation_policy_insert on public.case_automation_policy for insert to authenticated
with check (public.case_access_role(case_id, auth.uid()) = 'owner' and updated_by = auth.uid());

drop policy if exists case_automation_policy_update on public.case_automation_policy;
create policy case_automation_policy_update on public.case_automation_policy for update to authenticated
using (public.case_access_role(case_id, auth.uid()) = 'owner')
with check (public.case_access_role(case_id, auth.uid()) = 'owner' and updated_by = auth.uid());

create table if not exists public.case_automation_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  action_type text not null check (action_type in ('reminder','priority_escalated')),
  target_user_id uuid references auth.users(id),
  reason text not null,
  source text not null default 'automation' check (source in ('automation','copilot')),
  created_at timestamptz not null default now()
);
create index if not exists case_automation_actions_case_created_idx on public.case_automation_actions(case_id, created_at desc);
alter table public.case_automation_actions enable row level security;
drop policy if exists case_automation_actions_select on public.case_automation_actions;
create policy case_automation_actions_select on public.case_automation_actions for select to authenticated
using (public.case_access_role(case_id, auth.uid()) is not null);
revoke insert, update, delete on public.case_automation_actions from authenticated, anon;

create table if not exists public.case_copilot_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  estimated_cost_usd numeric(12,6) not null default 0,
  suggested_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists case_copilot_runs_case_created_idx on public.case_copilot_runs(case_id, created_at desc);
alter table public.case_copilot_runs enable row level security;
drop policy if exists case_copilot_runs_select on public.case_copilot_runs;
create policy case_copilot_runs_select on public.case_copilot_runs for select to authenticated
using (public.case_access_role(case_id, auth.uid()) is not null);
drop policy if exists case_copilot_runs_insert on public.case_copilot_runs;
create policy case_copilot_runs_insert on public.case_copilot_runs for insert to authenticated
with check (created_by = auth.uid() and public.case_access_role(case_id, auth.uid()) is not null);
revoke update, delete on public.case_copilot_runs from authenticated, anon;

create or replace function public.run_case_automation_sweep()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_policy record;
  v_review record;
  v_reminders integer := 0;
  v_escalations integer := 0;
  v_owner uuid;
  v_title text;
begin
  for v_policy in
    select p.*, c.user_id as owner_id, c.title, c.priority, g.current_round_id, g.round_deadline_at
    from public.case_automation_policy p
    join public.cases c on c.id = p.case_id
    join public.case_governance g on g.case_id = p.case_id
    where p.enabled = true
      and c.status not in ('decided','archived')
      and g.current_round_id is not null
      and g.round_deadline_at is not null
  loop
    v_owner := v_policy.owner_id;
    v_title := v_policy.title;

    if v_policy.auto_remind and v_policy.round_deadline_at <= now() + make_interval(hours => v_policy.remind_before_hours) then
      for v_review in
        select r.id, r.reviewer_id
        from public.case_review_requests r
        where r.case_id = v_policy.case_id
          and r.governance_round_id = v_policy.current_round_id
          and r.status = 'pending'
          and not exists (
            select 1 from public.case_automation_actions a
            where a.case_id = v_policy.case_id
              and a.action_type = 'reminder'
              and a.target_user_id = r.reviewer_id
              and a.created_at > now() - make_interval(hours => v_policy.cooldown_hours)
          )
      loop
        insert into public.user_notifications(user_id, actor_id, case_id, kind, title, body, href)
        values(v_review.reviewer_id, v_owner, v_policy.case_id, 'automation_reminder', 'Revisión pendiente', 'La ronda de aprobación de “' || left(v_title,120) || '” se acerca a su deadline.', '/casos/' || v_policy.case_id || '/revision');
        insert into public.case_automation_actions(case_id, action_type, target_user_id, reason)
        values(v_policy.case_id, 'reminder', v_review.reviewer_id, 'deadline_within_' || v_policy.remind_before_hours || '_hours');
        insert into public.case_events(case_id, user_id, event_type, title, payload)
        values(v_policy.case_id, v_owner, 'automation_reminder', 'Automatización: recordatorio enviado', jsonb_build_object('target_user_id',v_review.reviewer_id,'source','automation'));
        v_reminders := v_reminders + 1;
      end loop;
    end if;

    if v_policy.auto_raise_priority and v_policy.priority <> 'high' and v_policy.round_deadline_at <= now() + make_interval(hours => v_policy.escalate_before_hours) then
      update public.cases set priority='high', updated_at=now() where id=v_policy.case_id and priority<>'high';
      if found then
        insert into public.user_notifications(user_id, actor_id, case_id, kind, title, body, href)
        values(v_owner, v_owner, v_policy.case_id, 'automation_escalation', 'Prioridad elevada automáticamente', 'El caso “' || left(v_title,120) || '” entró en la ventana crítica de aprobación.', '/casos/' || v_policy.case_id);
        insert into public.case_automation_actions(case_id, action_type, reason)
        values(v_policy.case_id, 'priority_escalated', 'deadline_within_' || v_policy.escalate_before_hours || '_hours');
        insert into public.case_events(case_id, user_id, event_type, title, payload)
        values(v_policy.case_id, v_owner, 'automation_priority_escalated', 'Automatización: prioridad elevada', jsonb_build_object('source','automation'));
        v_escalations := v_escalations + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object('reminders',v_reminders,'priorityEscalations',v_escalations,'ranAt',now());
end;
$$;
revoke all on function public.run_case_automation_sweep() from public, anon, authenticated;
grant execute on function public.run_case_automation_sweep() to service_role;
