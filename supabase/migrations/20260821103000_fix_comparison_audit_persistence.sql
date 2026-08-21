alter table public.comparisons add column if not exists result_json jsonb;
update public.comparisons set result_json = result_data where result_json is null and result_data is not null;
drop policy if exists comparisons_insert on public.comparisons;
create policy comparisons_insert on public.comparisons for insert to authenticated with check (user_id = auth.uid());
drop policy if exists comparisons_select on public.comparisons;
create policy comparisons_select on public.comparisons for select to authenticated using (user_id = auth.uid());
create index if not exists idx_comparisons_trademark_result_json on public.comparisons using gin (result_json);
