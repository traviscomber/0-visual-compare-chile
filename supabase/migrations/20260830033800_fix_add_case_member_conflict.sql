create or replace function public.add_case_member_by_email(
  p_case_id uuid,
  p_email text,
  p_role text default 'viewer'::text
)
returns table(
  user_id uuid,
  email text,
  display_name text,
  role text
)
language plpgsql
security definer
set search_path = public, auth
as $function$
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
$function$;

revoke all on function public.add_case_member_by_email(uuid, text, text) from public;
revoke all on function public.add_case_member_by_email(uuid, text, text) from anon;
grant execute on function public.add_case_member_by_email(uuid, text, text) to authenticated;
grant execute on function public.add_case_member_by_email(uuid, text, text) to service_role;
