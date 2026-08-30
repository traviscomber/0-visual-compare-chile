create index if not exists intelligence_company_identity_reviews_reviewed_by_idx
  on public.intelligence_company_identity_reviews(reviewed_by)
  where reviewed_by is not null;

create index if not exists intelligence_feedback_audit_feedback_idx
  on public.intelligence_feedback_audit(feedback_id)
  where feedback_id is not null;

create index if not exists intelligence_source_alerts_run_idx
  on public.intelligence_source_alerts(run_id)
  where run_id is not null;

create index if not exists intelligence_source_health_history_run_idx
  on public.intelligence_source_health_history(run_id)
  where run_id is not null;
