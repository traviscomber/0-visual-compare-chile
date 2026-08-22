drop policy if exists trademark_labels_select on public.trademark_internal_labels;

create policy trademark_labels_select
  on public.trademark_internal_labels
  for select
  to authenticated
  using (organization_id is null);
