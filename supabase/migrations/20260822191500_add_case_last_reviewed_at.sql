alter table public.cases
  add column if not exists last_reviewed_at timestamptz;

create index if not exists cases_user_last_reviewed_idx
  on public.cases(user_id, last_reviewed_at desc nulls last);
