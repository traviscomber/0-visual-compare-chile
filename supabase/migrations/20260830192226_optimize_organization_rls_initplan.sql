-- Evaluate auth.uid() once per statement while preserving organization membership semantics.

alter policy orgs_insert_auth
  on public.organizations
  with check ((select auth.uid()) is not null);

alter policy orgs_select_member
  on public.organizations
  using (
    id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = (select auth.uid())
    )
  );

alter policy orgs_update_admin
  on public.organizations
  using (
    id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = (select auth.uid())
        and organization_members.role = 'admin'
    )
  );

alter policy org_members_select
  on public.organization_members
  using (
    organization_id in (
      select om2.organization_id
      from public.organization_members om2
      where om2.user_id = (select auth.uid())
    )
  );

alter policy org_members_insert_admin
  on public.organization_members
  with check (
    organization_id in (
      select organization_members_1.organization_id
      from public.organization_members organization_members_1
      where organization_members_1.user_id = (select auth.uid())
        and organization_members_1.role = 'admin'
    )
  );
