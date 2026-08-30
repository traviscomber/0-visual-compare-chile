drop policy if exists intelligence_change_baselines_service_only on public.intelligence_change_baselines;
create policy intelligence_change_baselines_service_only
  on public.intelligence_change_baselines
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists intelligence_source_states_service_only on public.intelligence_source_states;
create policy intelligence_source_states_service_only
  on public.intelligence_source_states
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists intelligence_source_events_service_only on public.intelligence_source_events;
create policy intelligence_source_events_service_only
  on public.intelligence_source_events
  for all
  to service_role
  using (true)
  with check (true);
