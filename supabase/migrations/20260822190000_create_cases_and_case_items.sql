create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  status text not null default 'open' check (status in ('open','review','decided','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  context_type text not null default 'general' check (context_type in ('general','brand','company','technology')),
  context_query text,
  decision_summary text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_user_status_updated_idx on public.cases(user_id,status,updated_at desc);

create table if not exists public.case_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  item_type text not null check (item_type in ('comparison','search','watch','alert','research')),
  source_id text,
  title text not null check (char_length(title) between 1 and 240),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists case_items_case_created_idx on public.case_items(case_id,created_at desc);
create unique index if not exists case_items_unique_source_idx on public.case_items(case_id,item_type,source_id);

alter table public.cases enable row level security;
alter table public.case_items enable row level security;

drop policy if exists cases_select_own on public.cases;
create policy cases_select_own on public.cases for select to authenticated using (user_id = auth.uid());
drop policy if exists cases_insert_own on public.cases;
create policy cases_insert_own on public.cases for insert to authenticated with check (user_id = auth.uid());
drop policy if exists cases_update_own on public.cases;
create policy cases_update_own on public.cases for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists cases_delete_own on public.cases;
create policy cases_delete_own on public.cases for delete to authenticated using (user_id = auth.uid());

drop policy if exists case_items_select_own on public.case_items;
create policy case_items_select_own on public.case_items for select to authenticated using (exists (select 1 from public.cases c where c.id = case_id and c.user_id = auth.uid()));
drop policy if exists case_items_insert_own on public.case_items;
create policy case_items_insert_own on public.case_items for insert to authenticated with check (exists (select 1 from public.cases c where c.id = case_id and c.user_id = auth.uid()));
drop policy if exists case_items_update_own on public.case_items;
create policy case_items_update_own on public.case_items for update to authenticated using (exists (select 1 from public.cases c where c.id = case_id and c.user_id = auth.uid())) with check (exists (select 1 from public.cases c where c.id = case_id and c.user_id = auth.uid()));
drop policy if exists case_items_delete_own on public.case_items;
create policy case_items_delete_own on public.case_items for delete to authenticated using (exists (select 1 from public.cases c where c.id = case_id and c.user_id = auth.uid()));