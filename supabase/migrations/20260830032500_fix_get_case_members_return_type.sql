-- Fix get_case_members() runtime type mismatch exposed by the real case collaboration flow.
-- auth.users.email is varchar while the RPC contract returns text; PL/pgSQL RETURN QUERY
-- requires an exact structural match for declared TABLE columns.

create or replace function public.get_case_members(p_case_id uuid)
returns table(
  user_id uuid,
  email text,
  display_name text,
  role text,
  is_owner boolean
)
language plpgsql
security definer
set search_path = public, auth
as $function$
begin
  if public.case_access_role(p_case_id, auth.uid()) is null then
    raise exception 'not_allowed';
  end if;

  return query
  select
    cm.user_id,
    u.email::text,
    coalesce(
      p.full_name,
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    )::text as display_name,
    cm.role,
    (cm.role = 'owner') as is_owner
  from public.case_members cm
  join auth.users u on u.id = cm.user_id
  left join public.profiles p on p.id = cm.user_id
  where cm.case_id = p_case_id
  order by
    case cm.role when 'owner' then 0 when 'editor' then 1 else 2 end,
    coalesce(p.full_name, u.email);
end
$function$;

revoke all on function public.get_case_members(uuid) from public;
revoke all on function public.get_case_members(uuid) from anon;
grant execute on function public.get_case_members(uuid) to authenticated;
grant execute on function public.get_case_members(uuid) to service_role;
