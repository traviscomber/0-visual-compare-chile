create or replace function private.add_case_member_by_email(p_case_id uuid, p_email text, p_role text default 'viewer')
returns table(user_id uuid, email text, display_name text, role text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_owner uuid;
  v_user uuid;
  v_email text;
  v_name text;
  v_role text;
begin
  select c.user_id into v_owner
  from public.cases c
  where c.id = p_case_id;

  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not_allowed';
  end if;

  v_role := case when p_role = 'editor' then 'editor' else 'viewer' end;

  select
    u.id,
    u.email::text,
    coalesce(
      p.full_name,
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    )::text
  into v_user, v_email, v_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if v_user is null then
    raise exception 'user_not_found';
  end if;

  if v_user = v_owner then
    raise exception 'already_owner';
  end if;

  insert into public.case_members(case_id, user_id, role, added_by)
  values (p_case_id, v_user, v_role, auth.uid())
  on conflict on constraint case_members_pkey
  do update set
    role = excluded.role,
    added_by = auth.uid();

  return query
  select v_user, v_email, v_name, v_role;
end
$$;
revoke all on function private.add_case_member_by_email(uuid, text, text) from public;
grant execute on function private.add_case_member_by_email(uuid, text, text) to authenticated, service_role;

create or replace function public.add_case_member_by_email(p_case_id uuid, p_email text, p_role text default 'viewer')
returns table(user_id uuid, email text, display_name text, role text)
language sql
security invoker
set search_path = public, private, auth
as $$
  select * from private.add_case_member_by_email(p_case_id, p_email, p_role)
$$;

create or replace function private.consume_case_copilot_quota()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_hour timestamptz := date_trunc('hour', now());
  v_day timestamptz := date_trunc('day', now());
  v_hour_count integer;
  v_day_count integer;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  insert into public.case_copilot_rate_limits(user_id,bucket_type,bucket_start,request_count,updated_at)
  values(v_user,'hour',v_hour,1,now())
  on conflict(user_id,bucket_type,bucket_start)
  do update set request_count = public.case_copilot_rate_limits.request_count + 1, updated_at = now()
  returning request_count into v_hour_count;

  insert into public.case_copilot_rate_limits(user_id,bucket_type,bucket_start,request_count,updated_at)
  values(v_user,'day',v_day,1,now())
  on conflict(user_id,bucket_type,bucket_start)
  do update set request_count = public.case_copilot_rate_limits.request_count + 1, updated_at = now()
  returning request_count into v_day_count;

  if v_hour_count > 20 or v_day_count > 100 then
    return jsonb_build_object('allowed',false,'hourCount',v_hour_count,'dayCount',v_day_count,'hourLimit',20,'dayLimit',100);
  end if;

  return jsonb_build_object('allowed',true,'hourCount',v_hour_count,'dayCount',v_day_count,'hourLimit',20,'dayLimit',100);
end
$$;
revoke all on function private.consume_case_copilot_quota() from public;
grant execute on function private.consume_case_copilot_quota() to authenticated, service_role;

create or replace function public.consume_case_copilot_quota()
returns jsonb
language sql
security invoker
set search_path = public, private
as $$
  select private.consume_case_copilot_quota()
$$;
