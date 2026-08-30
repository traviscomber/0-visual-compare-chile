alter table public.user_notifications drop constraint if exists user_notifications_kind_check;
alter table public.user_notifications add constraint user_notifications_kind_check check (kind = any (array[
  'review_requested'::text,
  'review_approved'::text,
  'review_changes_requested'::text,
  'mention'::text,
  'action_assigned'::text,
  'review_reminder'::text,
  'review_deadline_extended'::text,
  'automation_reminder'::text,
  'automation_escalation'::text
]));
