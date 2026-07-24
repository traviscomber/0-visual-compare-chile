-- Atomic per-user upload throttling for the private image pipeline.
-- Only the service role may consume quota; browser clients cannot alter counters.

begin;

create table if not exists public.image_upload_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_kind text not null check (window_kind in ('minute', 'day')),
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  bytes_count bigint not null default 0 check (bytes_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, window_kind, window_start)
);

alter table public.image_upload_rate_limits enable row level security;
alter table public.image_upload_rate_limits force row level security;

revoke all on table public.image_upload_rate_limits from public, anon, authenticated;
grant all on table public.image_upload_rate_limits to service_role;

create or replace function public.consume_image_upload_quota(
  p_user_id uuid,
  p_bytes bigint
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  remaining_minute integer,
  remaining_day integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_minute_start timestamptz;
  v_day_start timestamptz;
  v_minute_count integer := 0;
  v_day_count integer := 0;
  v_day_bytes bigint := 0;
  v_retry integer := 0;
  c_minute_limit constant integer := 10;
  c_day_limit constant integer := 100;
  c_day_bytes_limit constant bigint := 1073741824; -- 1 GiB/day
begin
  if p_user_id is null or p_bytes is null or p_bytes < 0 then
    raise exception 'invalid upload quota input';
  end if;

  v_minute_start := date_trunc('minute', v_now);
  v_day_start := (date_trunc('day', v_now at time zone 'UTC') at time zone 'UTC');

  -- Serialize quota consumption per user so parallel requests cannot bypass limits.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select request_count
    into v_minute_count
  from public.image_upload_rate_limits
  where user_id = p_user_id
    and window_kind = 'minute'
    and window_start = v_minute_start;
  v_minute_count := coalesce(v_minute_count, 0);

  select request_count, bytes_count
    into v_day_count, v_day_bytes
  from public.image_upload_rate_limits
  where user_id = p_user_id
    and window_kind = 'day'
    and window_start = v_day_start;
  v_day_count := coalesce(v_day_count, 0);
  v_day_bytes := coalesce(v_day_bytes, 0);

  if v_minute_count >= c_minute_limit then
    v_retry := greatest(1, ceil(extract(epoch from ((v_minute_start + interval '1 minute') - v_now)))::integer);
    return query select false, v_retry, 0, greatest(0, c_day_limit - v_day_count);
    return;
  end if;

  if v_day_count >= c_day_limit or v_day_bytes + p_bytes > c_day_bytes_limit then
    v_retry := greatest(1, ceil(extract(epoch from ((v_day_start + interval '1 day') - v_now)))::integer);
    return query select false, v_retry, greatest(0, c_minute_limit - v_minute_count), 0;
    return;
  end if;

  insert into public.image_upload_rate_limits (
    user_id,
    window_kind,
    window_start,
    request_count,
    bytes_count,
    updated_at
  ) values (
    p_user_id,
    'minute',
    v_minute_start,
    1,
    p_bytes,
    v_now
  )
  on conflict (user_id, window_kind, window_start)
  do update set
    request_count = public.image_upload_rate_limits.request_count + 1,
    bytes_count = public.image_upload_rate_limits.bytes_count + excluded.bytes_count,
    updated_at = excluded.updated_at;

  insert into public.image_upload_rate_limits (
    user_id,
    window_kind,
    window_start,
    request_count,
    bytes_count,
    updated_at
  ) values (
    p_user_id,
    'day',
    v_day_start,
    1,
    p_bytes,
    v_now
  )
  on conflict (user_id, window_kind, window_start)
  do update set
    request_count = public.image_upload_rate_limits.request_count + 1,
    bytes_count = public.image_upload_rate_limits.bytes_count + excluded.bytes_count,
    updated_at = excluded.updated_at;

  -- Keep the table bounded without requiring a separate scheduled cleanup job.
  delete from public.image_upload_rate_limits
  where user_id = p_user_id
    and window_start < v_day_start - interval '2 days';

  return query select
    true,
    0,
    greatest(0, c_minute_limit - (v_minute_count + 1)),
    greatest(0, c_day_limit - (v_day_count + 1));
end;
$$;

revoke all on function public.consume_image_upload_quota(uuid, bigint) from public, anon, authenticated;
grant execute on function public.consume_image_upload_quota(uuid, bigint) to service_role;

commit;
