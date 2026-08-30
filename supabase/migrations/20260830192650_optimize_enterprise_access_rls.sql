-- Consolidate equivalent permissive SELECT policies into one owner-or-admin rule.
-- Preserve INSERT ownership and admin-only UPDATE semantics.

drop policy if exists enterprise_requests_admin_select
  on public.enterprise_access_requests;
drop policy if exists enterprise_requests_select_own
  on public.enterprise_access_requests;

create policy enterprise_requests_select_accessible
  on public.enterprise_access_requests
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  );

alter policy enterprise_requests_insert_own
  on public.enterprise_access_requests
  with check (user_id = (select auth.uid()));

alter policy enterprise_requests_admin_update
  on public.enterprise_access_requests
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
