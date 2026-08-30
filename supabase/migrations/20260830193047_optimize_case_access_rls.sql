-- Consolidate redundant owner/collaborator policies and evaluate auth.uid() once per statement.
-- case_access_role() returns 'owner' for the case owner, so owner-specific read/write policies
-- that are strict subsets of collaborator policies can be removed without changing access.

-- cases: collaborator policies already include owners through case_access_role().
drop policy if exists cases_select_own on public.cases;
drop policy if exists cases_update_own on public.cases;
alter policy cases_select_collaborator on public.cases using (public.case_access_role(id, (select auth.uid())) is not null);
alter policy cases_update_collaborator on public.cases using (public.case_access_role(id, (select auth.uid())) = any (array['owner'::text,'editor'::text])) with check (public.case_access_role(id, (select auth.uid())) = any (array['owner'::text,'editor'::text]));
alter policy cases_insert_own on public.cases with check (user_id = (select auth.uid()));
alter policy cases_delete_own on public.cases using (user_id = (select auth.uid()));

-- case_items: collaborator policies already include owners through case_access_role().
drop policy if exists case_items_select_own on public.case_items;
drop policy if exists case_items_insert_own on public.case_items;
drop policy if exists case_items_update_own on public.case_items;
drop policy if exists case_items_delete_own on public.case_items;
alter policy case_items_select_collaborator on public.case_items using (public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_items_insert_collaborator on public.case_items with check (public.case_access_role(case_id, (select auth.uid())) = any (array['owner'::text,'editor'::text]));
alter policy case_items_update_collaborator on public.case_items using (public.case_access_role(case_id, (select auth.uid())) = any (array['owner'::text,'editor'::text])) with check (public.case_access_role(case_id, (select auth.uid())) = any (array['owner'::text,'editor'::text]));
alter policy case_items_delete_collaborator on public.case_items using (public.case_access_role(case_id, (select auth.uid())) = any (array['owner'::text,'editor'::text]));

-- case_events: preserve the exact union of actor ownership OR current case access in one policy.
drop policy if exists case_events_select_collaborator on public.case_events;
drop policy if exists case_events_select_own on public.case_events;
create policy case_events_select_accessible on public.case_events for select to public using (user_id = (select auth.uid()) or public.case_access_role(case_id, (select auth.uid())) is not null);

-- Remaining case collaboration surfaces: initPlan-only rewrites, no permission changes.
alter policy case_members_select_accessible on public.case_members using (public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_members_insert_owner on public.case_members with check (public.case_access_role(case_id, (select auth.uid())) = 'owner' and role = any (array['editor'::text,'viewer'::text]));
alter policy case_members_update_owner on public.case_members using (public.case_access_role(case_id, (select auth.uid())) = 'owner' and role <> 'owner') with check (public.case_access_role(case_id, (select auth.uid())) = 'owner' and role = any (array['editor'::text,'viewer'::text]));
alter policy case_members_delete_owner on public.case_members using (public.case_access_role(case_id, (select auth.uid())) = 'owner' and role <> 'owner');

alter policy case_comments_select_accessible on public.case_comments using (public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_comments_insert_accessible on public.case_comments with check (author_id = (select auth.uid()) and public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_comments_update_own on public.case_comments using (author_id = (select auth.uid()) and public.case_access_role(case_id, (select auth.uid())) is not null) with check (author_id = (select auth.uid()) and public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_comments_delete_own on public.case_comments using (author_id = (select auth.uid()) and public.case_access_role(case_id, (select auth.uid())) is not null);

alter policy case_actions_select_accessible on public.case_actions using (public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_actions_insert_editor on public.case_actions with check (created_by = (select auth.uid()) and public.case_access_role(case_id, (select auth.uid())) = any (array['owner'::text,'editor'::text]));
alter policy case_actions_update_editor_or_assignee on public.case_actions using (public.case_access_role(case_id, (select auth.uid())) = any (array['owner'::text,'editor'::text]) or assigned_to = (select auth.uid())) with check (public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_actions_delete_editor on public.case_actions using (public.case_access_role(case_id, (select auth.uid())) = any (array['owner'::text,'editor'::text]));

alter policy case_review_requests_select_accessible on public.case_review_requests using (public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_governance_select_accessible on public.case_governance using (public.case_access_role(case_id, (select auth.uid())) is not null);

alter policy case_automation_policy_select on public.case_automation_policy using (public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_automation_policy_insert on public.case_automation_policy with check (public.case_access_role(case_id, (select auth.uid())) = 'owner' and updated_by = (select auth.uid()));
alter policy case_automation_policy_update on public.case_automation_policy using (public.case_access_role(case_id, (select auth.uid())) = 'owner') with check (public.case_access_role(case_id, (select auth.uid())) = 'owner' and updated_by = (select auth.uid()));

alter policy case_automation_actions_select on public.case_automation_actions using (public.case_access_role(case_id, (select auth.uid())) is not null);

alter policy case_copilot_runs_select on public.case_copilot_runs using (public.case_access_role(case_id, (select auth.uid())) is not null);
alter policy case_copilot_runs_insert on public.case_copilot_runs with check (created_by = (select auth.uid()) and public.case_access_role(case_id, (select auth.uid())) is not null);
