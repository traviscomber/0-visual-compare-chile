-- Keep auth.uid() as an initPlan instead of evaluating it once per row.
-- Semantics and tenant boundaries remain unchanged.

alter policy intelligence_watches_select_own
  on public.intelligence_watches
  using ((select auth.uid()) = user_id);

alter policy intelligence_watches_insert_own
  on public.intelligence_watches
  with check ((select auth.uid()) = user_id);

alter policy intelligence_watches_update_own
  on public.intelligence_watches
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy intelligence_watches_delete_own
  on public.intelligence_watches
  using ((select auth.uid()) = user_id);

alter policy intelligence_watch_events_select_own
  on public.intelligence_watch_events
  using ((select auth.uid()) = user_id);

alter policy intelligence_watch_events_insert_own
  on public.intelligence_watch_events
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.intelligence_watches w
      where w.id = intelligence_watch_events.watch_id
        and w.user_id = (select auth.uid())
    )
  );

alter policy intelligence_watch_events_update_own
  on public.intelligence_watch_events
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy intelligence_watch_events_delete_own
  on public.intelligence_watch_events
  using ((select auth.uid()) = user_id);

alter policy trademark_watches_select_own
  on public.trademark_watches
  using ((select auth.uid()) = user_id);

alter policy trademark_watches_insert_own
  on public.trademark_watches
  with check ((select auth.uid()) = user_id);

alter policy trademark_watches_update_own
  on public.trademark_watches
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy trademark_watches_delete_own
  on public.trademark_watches
  using ((select auth.uid()) = user_id);

alter policy trademark_watch_signal_events_select_own
  on public.trademark_watch_signal_events
  using ((select auth.uid()) = user_id);

alter policy trademark_watch_signal_events_insert_own
  on public.trademark_watch_signal_events
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.trademark_watches w
      where w.id = trademark_watch_signal_events.watch_id
        and w.user_id = (select auth.uid())
    )
  );

alter policy trademark_watch_signal_events_update_own
  on public.trademark_watch_signal_events
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy trademark_watch_signal_events_delete_own
  on public.trademark_watch_signal_events
  using ((select auth.uid()) = user_id);

create index if not exists trademark_watch_signal_events_watch_id_idx
  on public.trademark_watch_signal_events (watch_id);
