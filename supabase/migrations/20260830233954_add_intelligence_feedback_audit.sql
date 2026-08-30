create table public.intelligence_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('strategic_watch_event')),
  target_key text not null check (char_length(target_key) between 1 and 300),
  feedback_type text not null check (feedback_type in ('relevant','irrelevant','false_match','identity_incorrect')),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, target_type, target_key)
);

create index intelligence_feedback_user_updated_idx
  on public.intelligence_feedback(user_id, updated_at desc);

alter table public.intelligence_feedback enable row level security;
revoke all on public.intelligence_feedback from public, anon, authenticated;
grant select on public.intelligence_feedback to authenticated;
grant select, insert, update, delete on public.intelligence_feedback to service_role;

create policy intelligence_feedback_select_own
  on public.intelligence_feedback
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create table public.intelligence_feedback_audit (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid references public.intelligence_feedback(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_key text not null,
  action text not null check (action in ('created','updated','deleted')),
  previous_feedback_type text,
  feedback_type text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index intelligence_feedback_audit_user_created_idx
  on public.intelligence_feedback_audit(user_id, created_at desc);

alter table public.intelligence_feedback_audit enable row level security;
revoke all on public.intelligence_feedback_audit from public, anon, authenticated;
grant select on public.intelligence_feedback_audit to authenticated;
grant select, insert, update, delete on public.intelligence_feedback_audit to service_role;

create policy intelligence_feedback_audit_select_own
  on public.intelligence_feedback_audit
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.submit_intelligence_feedback(
  p_target_type text,
  p_target_key text,
  p_feedback_type text,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.intelligence_feedback%rowtype;
  v_feedback_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if p_target_type <> 'strategic_watch_event' then
    raise exception 'unsupported_target_type';
  end if;
  if p_feedback_type not in ('relevant','irrelevant','false_match','identity_incorrect') then
    raise exception 'invalid_feedback_type';
  end if;
  if nullif(trim(p_target_key), '') is null or char_length(trim(p_target_key)) > 300 then
    raise exception 'invalid_target_key';
  end if;
  if not exists (
    select 1
    from public.intelligence_watch_events e
    where e.id::text = trim(p_target_key)
      and e.user_id = v_user_id
  ) then
    raise exception 'target_not_found';
  end if;

  select * into v_existing
  from public.intelligence_feedback f
  where f.user_id = v_user_id
    and f.target_type = p_target_type
    and f.target_key = trim(p_target_key)
  for update;

  if found then
    update public.intelligence_feedback
    set feedback_type = p_feedback_type,
        note = nullif(trim(p_note), ''),
        metadata = coalesce(p_metadata, '{}'::jsonb),
        updated_at = now()
    where id = v_existing.id
    returning id into v_feedback_id;

    insert into public.intelligence_feedback_audit (
      feedback_id,user_id,target_type,target_key,action,previous_feedback_type,feedback_type,note,metadata
    ) values (
      v_feedback_id,v_user_id,p_target_type,trim(p_target_key),'updated',v_existing.feedback_type,p_feedback_type,nullif(trim(p_note),''),coalesce(p_metadata,'{}'::jsonb)
    );
  else
    insert into public.intelligence_feedback (
      user_id,target_type,target_key,feedback_type,note,metadata
    ) values (
      v_user_id,p_target_type,trim(p_target_key),p_feedback_type,nullif(trim(p_note),''),coalesce(p_metadata,'{}'::jsonb)
    ) returning id into v_feedback_id;

    insert into public.intelligence_feedback_audit (
      feedback_id,user_id,target_type,target_key,action,feedback_type,note,metadata
    ) values (
      v_feedback_id,v_user_id,p_target_type,trim(p_target_key),'created',p_feedback_type,nullif(trim(p_note),''),coalesce(p_metadata,'{}'::jsonb)
    );
  end if;

  return v_feedback_id;
end;
$$;

revoke all on function public.submit_intelligence_feedback(text,text,text,text,jsonb) from public, anon;
grant execute on function public.submit_intelligence_feedback(text,text,text,text,jsonb) to authenticated, service_role;

create or replace function public.delete_intelligence_feedback(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.intelligence_feedback%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_existing
  from public.intelligence_feedback f
  where f.id = p_id and f.user_id = v_user_id
  for update;
  if not found then
    return false;
  end if;

  insert into public.intelligence_feedback_audit (
    feedback_id,user_id,target_type,target_key,action,previous_feedback_type,note,metadata
  ) values (
    v_existing.id,v_user_id,v_existing.target_type,v_existing.target_key,'deleted',v_existing.feedback_type,v_existing.note,v_existing.metadata
  );

  delete from public.intelligence_feedback where id = v_existing.id;
  return true;
end;
$$;

revoke all on function public.delete_intelligence_feedback(uuid) from public, anon;
grant execute on function public.delete_intelligence_feedback(uuid) to authenticated, service_role;
