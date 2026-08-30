-- Evaluate auth.uid() once per statement for straightforward ownership policies.
-- Authorization semantics and organization membership checks remain unchanged.

alter policy profiles_select_own
  on public.profiles
  using (id = (select auth.uid()));

alter policy profiles_insert_own
  on public.profiles
  with check (id = (select auth.uid()));

alter policy profiles_update_own
  on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy images_select_own_scope
  on public.images
  using (
    user_id = (select auth.uid())
    or organization_id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = (select auth.uid())
    )
  );

alter policy images_insert_own_scope
  on public.images
  with check (
    user_id = (select auth.uid())
    and (
      organization_id is null
      or organization_id in (
        select organization_members.organization_id
        from public.organization_members
        where organization_members.user_id = (select auth.uid())
      )
    )
  );

alter policy images_update_own_scope
  on public.images
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy images_delete_own_scope
  on public.images
  using (user_id = (select auth.uid()));

alter policy usage_logs_select_own_scope
  on public.usage_logs
  using (
    user_id = (select auth.uid())
    or organization_id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = (select auth.uid())
    )
  );

alter policy usage_logs_insert_own_scope
  on public.usage_logs
  with check (
    user_id = (select auth.uid())
    and (
      organization_id is null
      or organization_id in (
        select organization_members.organization_id
        from public.organization_members
        where organization_members.user_id = (select auth.uid())
      )
      or organization_id = (select auth.uid())
    )
  );

alter policy search_select_own
  on public.search_history
  using (user_id = (select auth.uid()));

alter policy search_insert_own
  on public.search_history
  with check (user_id = (select auth.uid()));

alter policy users_manage_own_patent_watches
  on public.patent_watches
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy users_read_own_patent_alert_events
  on public.patent_alert_events
  using ((select auth.uid()) = user_id);

alter policy users_update_own_patent_alert_events
  on public.patent_alert_events
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists patent_alert_events_patent_record_id_idx
  on public.patent_alert_events (patent_record_id);
