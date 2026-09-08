alter table public.intelligence_assistant_execution_metrics
  add constraint intelligence_assistant_execution_metrics_id_user_key unique (id, user_id);

create table public.intelligence_assistant_response_feedback (
  id uuid primary key default gen_random_uuid(),
  execution_metric_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome text not null check (outcome in ('resolved','partial','not_resolved')),
  issue_reason text check (issue_reason is null or issue_reason in ('incorrect','missing_evidence','incomplete','misunderstood','needed_followup','other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_assistant_response_feedback_owner_fk
    foreign key (execution_metric_id, user_id)
    references public.intelligence_assistant_execution_metrics(id, user_id)
    on delete cascade,
  constraint intelligence_assistant_response_feedback_execution_key unique (execution_metric_id),
  constraint intelligence_assistant_response_feedback_resolved_reason_check
    check (outcome <> 'resolved' or issue_reason is null)
);

create index intelligence_assistant_response_feedback_user_created_idx
  on public.intelligence_assistant_response_feedback (user_id, created_at desc);
create index intelligence_assistant_response_feedback_outcome_created_idx
  on public.intelligence_assistant_response_feedback (outcome, created_at desc);

alter table public.intelligence_assistant_response_feedback enable row level security;
revoke all on table public.intelligence_assistant_response_feedback from anon, authenticated;
grant select, insert, update, delete on table public.intelligence_assistant_response_feedback to service_role;

create policy "assistant response feedback service role"
  on public.intelligence_assistant_response_feedback
  for all to service_role using (true) with check (true);