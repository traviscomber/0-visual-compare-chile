-- Persistent, atomic rate limiting for the public trademark demo.
-- The application sends an HMAC client key, never the raw IP/user-agent identity.

begin;

create table if not exists public.public_demo_rate_limits (
  client_key text primary key,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists public_demo_rate_limits_updated_at_idx
  on public.public_demo_rate_limits (updated_at);

alter table public.public_demo_rate_limits enable row level security;
alter table public.public_demo_rate_limits force row level security;

revoke all on table public.public_demo_rate_limits from public, anon, authenticated;
grant all on table public.public_demo_rate_limits to service_role;

create or replace function public.reserve_public_demo_quota(
  p_client_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  request_count integer,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_request_count integer;
  v_reset_at timestamptz;
begin
  if p_client_key is null or length(trim(p_client_key)) < 32 then
    raise exception 'invalid public demo client key';
  end if;

  if p_limit is null or p_limit <= 0 then
    raise exception 'invalid public demo limit';
  end if;

  if p_window_seconds is null or p_window_seconds <= 0 or p_window_seconds > 86400 then
    raise exception 'invalid public demo window';
  end if;

  -- Serialize quota decisions for the same client. This prevents concurrent
  -- requests from observing the same counter and bypassing the hourly cap.
  perform pg_advisory_xact_lock(hashtextextended(p_client_key, 0));

  select r.window_start, r.request_count
    into v_window_start, v_request_count
  from public.public_demo_rate_limits r
  where r.client_key = p_client_key;

  if not found or v_now >= v_window_start + make_interval(secs => p_window_seconds) then
    v_window_start := v_now;
    v_request_count := 1;

    insert into public.public_demo_rate_limits (
      client_key,
      window_start,
      request_count,
      updated_at
    ) values (
      p_client_key,
      v_window_start,
      v_request_count,
      v_now
    )
    on conflict (client_key)
    do update set
      window_start = excluded.window_start,
      request_count = excluded.request_count,
      updated_at = excluded.updated_at;

    v_reset_at := v_window_start + make_interval(secs => p_window_seconds);
    return query select true, v_request_count, greatest(p_limit - v_request_count, 0), v_reset_at;
    return;
  end if;

  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  if v_request_count >= p_limit then
    update public.public_demo_rate_limits
      set updated_at = v_now
    where client_key = p_client_key;

    return query select false, v_request_count, 0, v_reset_at;
    return;
  end if;

  update public.public_demo_rate_limits
    set request_count = public.public_demo_rate_limits.request_count + 1,
        updated_at = v_now
  where client_key = p_client_key
  returning public.public_demo_rate_limits.request_count into v_request_count;

  -- Keep abandoned identities bounded without requiring a scheduled cleanup job.
  delete from public.public_demo_rate_limits
  where updated_at < v_now - interval '7 days';

  return query select true, v_request_count, greatest(p_limit - v_request_count, 0), v_reset_at;
end;
$$;

revoke all on function public.reserve_public_demo_quota(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_public_demo_quota(text, integer, integer)
  to service_role;

commit;
