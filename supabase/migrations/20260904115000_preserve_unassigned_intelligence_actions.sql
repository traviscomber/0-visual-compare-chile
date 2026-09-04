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

  -- Null is an intentional workflow state: executive attention may start without an owner.
  -- Do not silently self-assign the current user.
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

  update public.cases
     set updated_at = pg_catalog.now()
   where id = v_case_id;

  return query
  select v_case_id, v_item_id, v_action_id, v_case_created, v_item_created, v_action_created;
end;
$function$;
