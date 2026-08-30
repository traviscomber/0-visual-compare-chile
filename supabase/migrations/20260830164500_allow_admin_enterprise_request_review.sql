drop policy if exists "enterprise_requests_admin_select" on public.enterprise_access_requests;
create policy "enterprise_requests_admin_select"
  on public.enterprise_access_requests
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "enterprise_requests_admin_update" on public.enterprise_access_requests;
create policy "enterprise_requests_admin_update"
  on public.enterprise_access_requests
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant update on public.enterprise_access_requests to authenticated;
