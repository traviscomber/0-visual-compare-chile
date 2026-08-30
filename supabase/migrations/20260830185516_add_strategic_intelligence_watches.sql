create table if not exists public.intelligence_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_type text not null check (watch_type = any (array['technology'::text,'company'::text,'competitor'::text])),
  query text not null,
  normalized_query text not null,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  last_reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_watches_query_len check (char_length(trim(query)) between 2 and 160),
  constraint intelligence_watches_normalized_query_len check (char_length(trim(normalized_query)) between 2 and 160),
  constraint intelligence_watches_user_type_query_uq unique (user_id, watch_type, normalized_query)
);

create index if not exists intelligence_watches_user_active_idx
  on public.intelligence_watches (user_id, is_active, updated_at desc);

create table if not exists public.intelligence_watch_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid not null references public.intelligence_watches(id) on delete cascade,
  signal_key text not null,
  source_key text not null references public.intelligence_sources(source_key) on delete restrict,
  event_type text not null check (event_type = any (array['patent'::text,'trademark'::text,'publication'::text,'news'::text])),
  title text not null,
  summary text,
  source_url text,
  occurred_at timestamptz,
  relevance text not null check (relevance = any (array['alta'::text,'media'::text,'baja'::text])),
  payload jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_watch_events_user_watch_signal_uq unique (user_id, watch_id, signal_key)
);

create index if not exists intelligence_watch_events_user_first_seen_idx
  on public.intelligence_watch_events (user_id, first_seen_at desc);
create index if not exists intelligence_watch_events_watch_first_seen_idx
  on public.intelligence_watch_events (watch_id, first_seen_at desc);
create index if not exists intelligence_watch_events_source_type_idx
  on public.intelligence_watch_events (source_key, event_type, occurred_at desc);

alter table public.intelligence_watches enable row level security;
alter table public.intelligence_watch_events enable row level security;

drop policy if exists intelligence_watches_select_own on public.intelligence_watches;
create policy intelligence_watches_select_own on public.intelligence_watches for select to authenticated using (auth.uid() = user_id);
drop policy if exists intelligence_watches_insert_own on public.intelligence_watches;
create policy intelligence_watches_insert_own on public.intelligence_watches for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists intelligence_watches_update_own on public.intelligence_watches;
create policy intelligence_watches_update_own on public.intelligence_watches for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists intelligence_watches_delete_own on public.intelligence_watches;
create policy intelligence_watches_delete_own on public.intelligence_watches for delete to authenticated using (auth.uid() = user_id);

drop policy if exists intelligence_watch_events_select_own on public.intelligence_watch_events;
create policy intelligence_watch_events_select_own on public.intelligence_watch_events for select to authenticated using (auth.uid() = user_id);
drop policy if exists intelligence_watch_events_insert_own on public.intelligence_watch_events;
create policy intelligence_watch_events_insert_own on public.intelligence_watch_events for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.intelligence_watches w where w.id = intelligence_watch_events.watch_id and w.user_id = auth.uid()
  )
);
drop policy if exists intelligence_watch_events_update_own on public.intelligence_watch_events;
create policy intelligence_watch_events_update_own on public.intelligence_watch_events for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists intelligence_watch_events_delete_own on public.intelligence_watch_events;
create policy intelligence_watch_events_delete_own on public.intelligence_watch_events for delete to authenticated using (auth.uid() = user_id);

revoke all on table public.intelligence_watches from anon;
revoke all on table public.intelligence_watch_events from anon;
grant select, insert, update, delete on table public.intelligence_watches to authenticated;
grant select, insert, update, delete on table public.intelligence_watch_events to authenticated;
