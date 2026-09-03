-- Add source provenance for patent watches without changing existing INAPI semantics.
-- This first stage is intentionally backward-compatible with the currently deployed
-- three-column patent watch upsert. The legacy uniqueness constraint is removed only
-- in the post-deploy cleanup migration after source-aware application code is live.
alter table public.patent_watches
  add column if not exists source_type text not null default 'inapi_open_data',
  add column if not exists source_url text,
  add column if not exists source_status text not null default 'available',
  add column if not exists source_last_error text,
  add column if not exists source_last_checked_at timestamptz;

alter table public.patent_watches
  drop constraint if exists patent_watches_source_type_check,
  add constraint patent_watches_source_type_check
    check (source_type in ('inapi_open_data', 'wipo_patentscope_rss')),
  drop constraint if exists patent_watches_source_status_check,
  add constraint patent_watches_source_status_check
    check (source_status in ('available', 'degraded', 'not_configured')),
  drop constraint if exists patent_watches_source_url_check,
  add constraint patent_watches_source_url_check
    check (source_type <> 'wipo_patentscope_rss' or source_url is not null);

create unique index if not exists patent_watches_user_type_query_source_uidx
  on public.patent_watches(user_id, watch_type, normalized_query, source_type);

alter table public.patent_alert_events
  alter column patent_record_id drop not null,
  add column if not exists source_key text not null default 'inapi_open_data',
  add column if not exists source_record_id text,
  add column if not exists source_url text,
  add column if not exists source_date date,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists patent_alert_events_external_source_uidx
  on public.patent_alert_events(watch_id, source_key, source_record_id, event_type)
  where source_record_id is not null;

create index if not exists patent_watches_wipo_active_idx
  on public.patent_watches(source_type, is_active, source_last_checked_at)
  where source_type = 'wipo_patentscope_rss';

comment on column public.patent_watches.source_url is
  'Optional official source feed URL. WIPO RSS URLs must be validated server-side before persistence.';
comment on column public.patent_alert_events.source_key is
  'Observed source provenance. INAPI remains canonical Chile evidence; WIPO RSS is external observed evidence.';
