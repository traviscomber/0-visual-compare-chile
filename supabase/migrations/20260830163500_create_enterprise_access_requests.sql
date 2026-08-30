create table if not exists public.enterprise_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  company_name text not null,
  user_count integer null check (user_count is null or (user_count >= 1 and user_count <= 100000)),
  use_case text not null,
  brand_context text null,
  status text not null default 'new' check (status in ('new','contacted','qualified','approved','rejected','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enterprise_access_requests_user_created_idx
  on public.enterprise_access_requests(user_id, created_at desc);
create index if not exists enterprise_access_requests_status_created_idx
  on public.enterprise_access_requests(status, created_at desc);

alter table public.enterprise_access_requests enable row level security;

drop policy if exists "enterprise_requests_insert_own" on public.enterprise_access_requests;
create policy "enterprise_requests_insert_own"
  on public.enterprise_access_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "enterprise_requests_select_own" on public.enterprise_access_requests;
create policy "enterprise_requests_select_own"
  on public.enterprise_access_requests
  for select
  to authenticated
  using (user_id = auth.uid());

grant select, insert on public.enterprise_access_requests to authenticated;
