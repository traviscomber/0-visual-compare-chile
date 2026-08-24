create or replace function public.get_case_members_batch(p_case_ids uuid[])
returns table(
  case_id uuid,
  user_id uuid,
  email text,
  display_name text,
  role text,
  is_owner boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if p_case_ids is null or cardinality(p_case_ids) = 0 then
    return;
  end if;

  if cardinality(p_case_ids) > 100 then
    raise exception 'too_many_cases';
  end if;

  if exists (
    select 1
    from unnest(p_case_ids) as requested(case_id)
    where public.case_access_role(requested.case_id, auth.uid()) is null
  ) then
    raise exception 'not_allowed';
  end if;

  return query
  select
    cm.case_id,
    cm.user_id,
    u.email::text,
    coalesce(p.full_name, u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))::text,
    cm.role,
    (cm.role = 'owner')
  from public.case_members cm
  join auth.users u on u.id = cm.user_id
  left join public.profiles p on p.id = cm.user_id
  where cm.case_id = any(p_case_ids)
  order by cm.case_id,
    case cm.role when 'owner' then 0 when 'editor' then 1 else 2 end,
    coalesce(p.full_name, u.email);
end;
$$;

revoke all on function public.get_case_members_batch(uuid[]) from public;
revoke all on function public.get_case_members_batch(uuid[]) from anon;
grant execute on function public.get_case_members_batch(uuid[]) to authenticated;
