alter table public.case_events drop constraint if exists case_events_event_type_check;
alter table public.case_events add constraint case_events_event_type_check check (event_type = any (array[
  'case_created'::text,
  'status_changed'::text,
  'priority_changed'::text,
  'decision_changed'::text,
  'notes_changed'::text,
  'review_checkpoint'::text,
  'item_added'::text,
  'item_removed'::text,
  'member_added'::text,
  'member_removed'::text,
  'comment_added'::text,
  'action_added'::text,
  'action_completed'::text,
  'review_requested'::text,
  'review_approved'::text,
  'review_changes_requested'::text,
  'review_cancelled'::text,
  'review_reminder_sent'::text,
  'review_deadline_extended'::text,
  'automation_reminder'::text,
  'automation_priority_escalated'::text
]));
