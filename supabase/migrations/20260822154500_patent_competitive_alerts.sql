create table if not exists public.patent_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_type text not null check (watch_type in ('company','ipc')),
  query text not null,
  normalized_query text not null,
  is_active boolean not null default true,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, watch_type, normalized_query)
);

create table if not exists public.patent_alert_events (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid not null references public.patent_watches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  patent_record_id uuid not null references public.patent_records(id) on delete cascade,
  event_type text not null default 'new_application',
  title text not null,
  application_number text,
  applicants text,
  ipc_codes text[] not null default '{}',
  filing_date date,
  detected_at timestamptz not null default now(),
  read_at timestamptz,
  unique(watch_id, patent_record_id, event_type)
);

create index if not exists patent_watches_active_idx on public.patent_watches(is_active, last_checked_at);
create index if not exists patent_alert_events_user_detected_idx on public.patent_alert_events(user_id, detected_at desc);

alter table public.patent_watches enable row level security;
alter table public.patent_alert_events enable row level security;

create policy "users_manage_own_patent_watches" on public.patent_watches
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_read_own_patent_alert_events" on public.patent_alert_events
for select to authenticated using (auth.uid() = user_id);
create policy "users_update_own_patent_alert_events" on public.patent_alert_events
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.detect_patent_watch_events()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  inserted_count integer := 0;
begin
  with candidate_matches as (
    select distinct
      w.id as watch_id,
      w.user_id,
      pr.id as patent_record_id,
      pr.title,
      pr.application_number,
      pr.applicants,
      pr.filing_date,
      coalesce(array_agg(distinct pi.code) filter (where pi.code is not null), '{}') as ipc_codes
    from public.patent_watches w
    join public.patent_records pr
      on pr.source = 'inapi'
     and pr.created_at > w.last_checked_at
     and pr.filing_date >= w.created_at::date
    left join public.patent_record_ipc pi on pi.patent_record_id = pr.id
    where w.is_active
      and (
        (w.watch_type = 'company' and upper(extensions.unaccent(coalesce(pr.applicants,''))) like '%' || w.normalized_query || '%')
        or
        (w.watch_type = 'ipc' and exists (
          select 1 from public.patent_record_ipc pix
          where pix.patent_record_id = pr.id and upper(pix.code) like w.normalized_query || '%'
        ))
      )
    group by w.id, w.user_id, pr.id
  ), inserted as (
    insert into public.patent_alert_events (
      watch_id, user_id, patent_record_id, title, application_number, applicants, ipc_codes, filing_date
    )
    select watch_id, user_id, patent_record_id, title, application_number, applicants, ipc_codes, filing_date
    from candidate_matches
    on conflict (watch_id, patent_record_id, event_type) do nothing
    returning 1
  )
  select count(*) into inserted_count from inserted;

  update public.patent_watches set last_checked_at = now(), updated_at = now() where is_active;
  return jsonb_build_object('inserted', inserted_count, 'checkedAt', now());
end;
$$;

revoke all on function public.detect_patent_watch_events() from public;
grant execute on function public.detect_patent_watch_events() to service_role;