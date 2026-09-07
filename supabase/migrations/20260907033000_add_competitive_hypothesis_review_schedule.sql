alter table public.competitive_hypothesis_monitoring_events
  add column if not exists next_review_at timestamptz null;

alter table public.competitive_hypothesis_monitoring_events
  drop constraint if exists competitive_hypothesis_monitoring_next_review_valid;

alter table public.competitive_hypothesis_monitoring_events
  add constraint competitive_hypothesis_monitoring_next_review_valid
  check (next_review_at is null or reviewed_at is null or next_review_at > reviewed_at);

create index if not exists competitive_hypothesis_monitoring_next_review_idx
  on public.competitive_hypothesis_monitoring_events(hypothesis_id, next_review_at desc)
  where next_review_at is not null;
