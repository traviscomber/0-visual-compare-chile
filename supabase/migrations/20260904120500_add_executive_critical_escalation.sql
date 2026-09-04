alter table public.case_automation_actions
  drop constraint if exists case_automation_actions_action_type_check;

alter table public.case_automation_actions
  add constraint case_automation_actions_action_type_check
  check (action_type = any (array[
    'reminder'::text,
    'priority_escalated'::text,
    'action_due_reminder'::text,
    'action_overdue_escalation'::text,
    'executive_unassigned_escalation'::text
  ]));

create or replace function public.create_intelligence_action(
  p_context_type text,
  p_context_query text,
  p_case_title text,
  p_item_type text,
  p_source_id text,
  p_source_title text,
  p_action_title text,
  p_priority text default 'normal'::text,
  p_due_at timestamptz default null,
  p_assigned_to uuid default null,
  p_evidence jsonb default '{}'::jsonb
)
returns table(
  case_id uuid,
  item_id uuid,
  action_id uuid,
  case_created boolean,
  item_created boolean,
  action_created boolean
)
language plpgsql
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_case_id uuid;
  v_item_id uuid;
  v_action_id uuid;
  v_case_created boolean := false;
  v_item_created boolean := false;
  v_action_created boolean := false;
  v_assigned_to uuid;
  v_context_query text := nullif(trim(p_context_query), '');
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_context_type not in ('general', 'brand', 'company', 'technology') then
    raise exception 'invalid_context_type';
  end if;
  if p_item_type not in ('comparison', 'search', 'watch', 'alert', 'research') then
    raise exception 'invalid_item_type';
  end if;
  if p_priority not in ('low', 'normal', 'high') then
    raise exception 'invalid_priority';
  end if;
  if v_context_query is null or char_length(v_context_query) > 240 then
    raise exception 'invalid_context_query';
  end if;
  if char_length(trim(p_case_title)) < 2 or char_length(trim(p_case_title)) > 160 then
    raise exception 'invalid_case_title';
  end if;
  if nullif(trim(p_source_id), '') is null or char_length(trim(p_source_id)) > 240 then
    raise exception 'invalid_source_id';
  end if;
  if nullif(trim(p_source_title), '') is null or char_length(trim(p_source_title)) > 240 then
    raise exception 'invalid_source_title';
  end if;
  if nullif(trim(p_action_title), '') is null or char_length(trim(p_action_title)) > 240 then
    raise exception 'invalid_action_title';
  end if;

  v_assigned_to := p_assigned_to;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_user_id::text || ':' || p_context_type || ':' || lower(v_context_query) || ':' || trim(p_source_id) || ':' || lower(trim(p_action_title)),
      0
    )
  );

  select c.id
    into v_case_id
    from public.cases c
   where c.user_id = v_user_id
     and c.status in ('open', 'review')
     and c.context_type = p_context_type
     and lower(coalesce(c.context_query, '')) = lower(v_context_query)
     and c.title = trim(p_case_title)
   order by c.updated_at desc, c.created_at desc
   limit 1;

  if v_case_id is null then
    v_case_id := pg_catalog.gen_random_uuid();
    insert into public.cases (
      id, user_id, title, status, priority, context_type, context_query, updated_at
    ) values (
      v_case_id, v_user_id, trim(p_case_title), 'open', p_priority, p_context_type, v_context_query, pg_catalog.now()
    );
    v_case_created := true;
  end if;

  select ci.id
    into v_item_id
    from public.case_items ci
   where ci.case_id = v_case_id
     and ci.item_type = p_item_type
     and ci.source_id = trim(p_source_id)
   limit 1;

  if v_item_id is null then
    v_item_id := pg_catalog.gen_random_uuid();
    insert into public.case_items (
      id, case_id, item_type, source_id, title, metadata
    ) values (
      v_item_id, v_case_id, p_item_type, trim(p_source_id), trim(p_source_title), coalesce(p_evidence, '{}'::jsonb)
    );
    v_item_created := true;
  else
    update public.case_items
       set title = trim(p_source_title),
           metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_evidence, '{}'::jsonb)
     where id = v_item_id;
  end if;

  select ca.id
    into v_action_id
    from public.case_actions ca
   where ca.case_id = v_case_id
     and ca.title = trim(p_action_title)
     and ca.status = 'open'
   order by ca.created_at desc
   limit 1;

  if v_action_id is null then
    v_action_id := pg_catalog.gen_random_uuid();
    insert into public.case_actions (
      id, case_id, title, assigned_to, created_by, status, due_at, updated_at
    ) values (
      v_action_id, v_case_id, trim(p_action_title), v_assigned_to, v_user_id, 'open', p_due_at, pg_catalog.now()
    );
    v_action_created := true;
  else
    update public.case_actions
       set assigned_to = case when p_assigned_to is null then assigned_to else v_assigned_to end,
           due_at = coalesce(p_due_at, due_at),
           updated_at = pg_catalog.now()
     where id = v_action_id;
  end if;

  update public.case_items
     set metadata = coalesce(metadata, '{}'::jsonb)
       || jsonb_build_object('linked_action_id', v_action_id::text)
   where id = v_item_id;

  update public.cases
     set updated_at = pg_catalog.now()
   where id = v_case_id;

  return query
  select v_case_id, v_item_id, v_action_id, v_case_created, v_item_created, v_action_created;
end;
$function$;

create or replace function public.run_case_automation_sweep()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_policy record;
  v_review record;
  v_action record;
  v_critical_action record;
  v_action_log_id uuid;
  v_reminders integer := 0;
  v_escalations integer := 0;
  v_action_due_reminders integer := 0;
  v_action_overdue_escalations integer := 0;
  v_executive_unassigned_escalations integer := 0;
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

  for v_critical_action in
    select distinct
      a.id,
      a.case_id,
      a.title as action_title,
      a.due_at,
      a.created_at,
      c.user_id as owner_id,
      c.title as case_title
    from public.case_actions a
    join public.cases c on c.id = a.case_id
    join public.case_items ci
      on ci.case_id = a.case_id
     and ci.metadata->>'origin' = 'executive_attention'
     and ci.metadata->>'attentionPriority' = 'critica'
     and ci.metadata->>'linked_action_id' = a.id::text
    where a.status = 'open'
      and a.assigned_to is null
      and c.status not in ('decided','archived')
  loop
    v_action_log_id := null;
    insert into public.case_automation_actions(
      case_id, case_action_id, action_type, target_user_id, reason, due_at_snapshot
    ) values (
      v_critical_action.case_id,
      v_critical_action.id,
      'executive_unassigned_escalation',
      v_critical_action.owner_id,
      'critical_executive_action_unassigned',
      coalesce(v_critical_action.due_at, v_critical_action.created_at)
    )
    on conflict do nothing
    returning id into v_action_log_id;

    if v_action_log_id is not null then
      insert into public.user_notifications(user_id, actor_id, case_id, kind, title, body, href)
      values(
        v_critical_action.owner_id,
        v_critical_action.owner_id,
        v_critical_action.case_id,
        'automation_escalation',
        'Acción crítica sin responsable',
        'La acción “' || left(v_critical_action.action_title,120) || '” requiere asignación de responsable.',
        '/casos/' || v_critical_action.case_id || '/equipo'
      );

      insert into public.case_events(case_id, user_id, event_type, title, payload)
      values(
        v_critical_action.case_id,
        v_critical_action.owner_id,
        'automation_priority_escalated',
        'Automatización: acción crítica sin responsable escalada',
        jsonb_build_object(
          'source','automation',
          'case_action_id',v_critical_action.id,
          'owner_user_id',v_critical_action.owner_id,
          'due_at',v_critical_action.due_at,
          'automation_action_id',v_action_log_id,
          'reason','critical_executive_action_unassigned',
          'priority_changed',false
        )
      );
      v_executive_unassigned_escalations := v_executive_unassigned_escalations + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'reminders',v_reminders,
    'priorityEscalations',v_escalations,
    'actionDueReminders',v_action_due_reminders,
    'actionOverdueEscalations',v_action_overdue_escalations,
    'executiveUnassignedEscalations',v_executive_unassigned_escalations,
    'ranAt',now()
  );
end;
$function$;
