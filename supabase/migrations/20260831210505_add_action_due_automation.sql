alter table public.case_automation_actions
  add column if not exists case_action_id uuid references public.case_actions(id) on delete cascade,
  add column if not exists due_at_snapshot timestamptz;

alter table public.case_automation_actions
  drop constraint if exists case_automation_actions_action_type_check;

alter table public.case_automation_actions
  add constraint case_automation_actions_action_type_check
  check (action_type in (
    'reminder',
    'priority_escalated',
    'action_due_reminder',
    'action_overdue_escalation'
  ));

alter table public.case_automation_actions
  drop constraint if exists case_automation_actions_deadline_snapshot_check;

alter table public.case_automation_actions
  add constraint case_automation_actions_deadline_snapshot_check
  check (
    action_type not in ('action_due_reminder','action_overdue_escalation')
    or (case_action_id is not null and due_at_snapshot is not null)
  );

create unique index if not exists case_automation_actions_deadline_dedupe_uq
  on public.case_automation_actions(case_action_id, action_type, due_at_snapshot)
  where case_action_id is not null;

create index if not exists case_actions_open_due_idx
  on public.case_actions(due_at, assigned_to)
  where status = 'open' and due_at is not null and assigned_to is not null;

create or replace function public.run_case_automation_sweep()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_policy record;
  v_review record;
  v_action record;
  v_action_log_id uuid;
  v_reminders integer := 0;
  v_escalations integer := 0;
  v_action_due_reminders integer := 0;
  v_action_overdue_escalations integer := 0;
  v_owner uuid;
  v_title text;
begin
  -- Existing review-round automation remains unchanged.
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

  -- Action deadlines are universal: assigned open work with due_at does not require
  -- the case-level review automation policy to be enabled.
  for v_action in
    select
      a.id,
      a.case_id,
      a.title as action_title,
      a.assigned_to,
      a.due_at,
      c.user_id as owner_id,
      c.title as case_title
    from public.case_actions a
    join public.cases c on c.id = a.case_id
    where a.status = 'open'
      and a.assigned_to is not null
      and a.due_at is not null
      and c.status not in ('decided','archived')
      and a.due_at <= now() + interval '48 hours'
    order by a.due_at asc
  loop
    if v_action.due_at > now() then
      v_action_log_id := null;
      insert into public.case_automation_actions(
        case_id, case_action_id, action_type, target_user_id, reason, due_at_snapshot
      ) values (
        v_action.case_id,
        v_action.id,
        'action_due_reminder',
        v_action.assigned_to,
        'action_due_within_48_hours',
        v_action.due_at
      )
      on conflict do nothing
      returning id into v_action_log_id;

      if v_action_log_id is not null then
        insert into public.user_notifications(user_id, actor_id, case_id, kind, title, body, href)
        values(
          v_action.assigned_to,
          v_action.owner_id,
          v_action.case_id,
          'automation_reminder',
          'Tarea próxima a vencer',
          '“' || left(v_action.action_title,120) || '” vence dentro de 48 horas.',
          '/casos/' || v_action.case_id || '/equipo'
        );
        insert into public.case_events(case_id, user_id, event_type, title, payload)
        values(
          v_action.case_id,
          v_action.owner_id,
          'automation_reminder',
          'Automatización: tarea próxima a vencer',
          jsonb_build_object(
            'source','automation',
            'case_action_id',v_action.id,
            'target_user_id',v_action.assigned_to,
            'due_at',v_action.due_at,
            'automation_action_id',v_action_log_id
          )
        );
        v_action_due_reminders := v_action_due_reminders + 1;
      end if;
    else
      v_action_log_id := null;
      insert into public.case_automation_actions(
        case_id, case_action_id, action_type, target_user_id, reason, due_at_snapshot
      ) values (
        v_action.case_id,
        v_action.id,
        'action_overdue_escalation',
        v_action.assigned_to,
        'action_overdue',
        v_action.due_at
      )
      on conflict do nothing
      returning id into v_action_log_id;

      if v_action_log_id is not null then
        insert into public.user_notifications(user_id, actor_id, case_id, kind, title, body, href)
        values(
          v_action.assigned_to,
          v_action.owner_id,
          v_action.case_id,
          'automation_escalation',
          'Tarea vencida',
          '“' || left(v_action.action_title,120) || '” superó su fecha límite.',
          '/casos/' || v_action.case_id || '/equipo'
        );

        if v_action.owner_id <> v_action.assigned_to then
          insert into public.user_notifications(user_id, actor_id, case_id, kind, title, body, href)
          values(
            v_action.owner_id,
            v_action.owner_id,
            v_action.case_id,
            'automation_escalation',
            'Tarea vencida',
            'La tarea “' || left(v_action.action_title,120) || '” asignada en “' || left(v_action.case_title,120) || '” está vencida.',
            '/casos/' || v_action.case_id || '/equipo'
          );
        end if;

        insert into public.case_events(case_id, user_id, event_type, title, payload)
        values(
          v_action.case_id,
          v_action.owner_id,
          'automation_priority_escalated',
          'Automatización: tarea vencida escalada',
          jsonb_build_object(
            'source','automation',
            'case_action_id',v_action.id,
            'target_user_id',v_action.assigned_to,
            'owner_user_id',v_action.owner_id,
            'due_at',v_action.due_at,
            'automation_action_id',v_action_log_id,
            'priority_changed',false
          )
        );
        v_action_overdue_escalations := v_action_overdue_escalations + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'reminders',v_reminders,
    'priorityEscalations',v_escalations,
    'actionDueReminders',v_action_due_reminders,
    'actionOverdueEscalations',v_action_overdue_escalations,
    'ranAt',now()
  );
end;
$$;

revoke all on function public.run_case_automation_sweep() from public, anon, authenticated;
grant execute on function public.run_case_automation_sweep() to service_role;
