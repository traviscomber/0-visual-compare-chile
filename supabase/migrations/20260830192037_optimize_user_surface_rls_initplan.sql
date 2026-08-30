-- Optimize straightforward user-scoped RLS policies without changing access semantics.

alter policy user_notifications_select_own
  on public.user_notifications
  using (user_id = (select auth.uid()));

alter policy user_notifications_update_own
  on public.user_notifications
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy comparisons_select
  on public.comparisons
  using (user_id = (select auth.uid()));

alter policy comparisons_insert
  on public.comparisons
  with check (user_id = (select auth.uid()));

alter policy trademark_comparison_labels_select
  on public.trademark_comparison_labels
  using (user_id = (select auth.uid()));

alter policy trademark_comparison_labels_insert
  on public.trademark_comparison_labels
  with check (user_id = (select auth.uid()));

alter policy trademark_comparison_labels_delete
  on public.trademark_comparison_labels
  using (user_id = (select auth.uid()));

alter policy trademark_labels_insert
  on public.trademark_internal_labels
  with check (
    created_by = (select auth.uid())
    and (
      organization_id is null
      or organization_id in (
        select organization_members.organization_id
        from public.organization_members
        where organization_members.user_id = (select auth.uid())
      )
    )
  );

alter policy trademark_audit_select
  on public.trademark_label_audit_log
  using (user_id = (select auth.uid()));

alter policy trademark_audit_insert
  on public.trademark_label_audit_log
  with check (user_id = (select auth.uid()));
