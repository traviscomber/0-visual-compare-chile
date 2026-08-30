-- Remove redundant admin SELECT coverage from the ALL policy while preserving permissions.
-- Organization members may read keys; organization admins may create, update, or delete them.

drop policy if exists api_keys_manage_admin
  on public.api_keys;

alter policy api_keys_select_org
  on public.api_keys
  using (
    organization_id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = (select auth.uid())
    )
  );

create policy api_keys_insert_admin
  on public.api_keys
  for insert
  to public
  with check (
    organization_id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = (select auth.uid())
        and organization_members.role = 'admin'
    )
  );

create policy api_keys_update_admin
  on public.api_keys
  for update
  to public
  using (
    organization_id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = (select auth.uid())
        and organization_members.role = 'admin'
    )
  )
  with check (
    organization_id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = (select auth.uid())
        and organization_members.role = 'admin'
    )
  );

create policy api_keys_delete_admin
  on public.api_keys
  for delete
  to public
  using (
    organization_id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = (select auth.uid())
        and organization_members.role = 'admin'
    )
  );
