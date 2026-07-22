-- Atomic API quota reservation.
-- Counters are stored separately from usage_logs so audit events never double-count requests.
-- This migration does not modify or delete historical usage data.

create table if not exists public.api_quota_counters (
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  period_type text not null check (period_type in ('day', 'month')),
  period_start date not null,
  usage_count bigint not null default 0 check (usage_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (api_key_id, period_type, period_start)
);

alter table public.api_quota_counters enable row level security;

revoke all on table public.api_quota_counters from public, anon, authenticated;
grant select, insert, update, delete on table public.api_quota_counters to service_role;

create or replace function public.reserve_api_quota(
  p_api_key_id uuid,
  p_organization_id uuid,
  p_user_id uuid
)
returns table (
  allowed boolean,
  quota_daily integer,
  quota_monthly integer,
  usage_today bigint,
  usage_month bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daily_quota integer;
  v_monthly_quota integer;
  v_today date := current_date;
  v_month date := date_trunc('month', current_date)::date;
  v_today_count bigint;
  v_month_count bigint;
begin
  -- Serialize reservations for one API key while leaving other tenants independent.
  perform pg_advisory_xact_lock(hashtextextended(p_api_key_id::text, 0));

  select
    coalesce(ak.quota_daily, 100),
    coalesce(ak.quota_monthly, 2000)
  into v_daily_quota, v_monthly_quota
  from public.api_keys ak
  where ak.id = p_api_key_id
    and ak.organization_id = p_organization_id
    and ak.user_id = p_user_id
    and ak.is_active = true
    and (ak.expires_at is null or ak.expires_at > now())
  for update;

  if not found then
    return query select false, 0, 0, 0::bigint, 0::bigint;
    return;
  end if;

  select coalesce(aqc.usage_count, 0)
  into v_today_count
  from public.api_quota_counters aqc
  where aqc.api_key_id = p_api_key_id
    and aqc.period_type = 'day'
    and aqc.period_start = v_today;

  if not found then
    v_today_count := 0;
  end if;

  select coalesce(aqc.usage_count, 0)
  into v_month_count
  from public.api_quota_counters aqc
  where aqc.api_key_id = p_api_key_id
    and aqc.period_type = 'month'
    and aqc.period_start = v_month;

  if not found then
    v_month_count := 0;
  end if;

  if v_today_count >= v_daily_quota or v_month_count >= v_monthly_quota then
    return query select false, v_daily_quota, v_monthly_quota, v_today_count, v_month_count;
    return;
  end if;

  insert into public.api_quota_counters (api_key_id, period_type, period_start, usage_count, updated_at)
  values (p_api_key_id, 'day', v_today, 1, now())
  on conflict (api_key_id, period_type, period_start)
  do update set
    usage_count = public.api_quota_counters.usage_count + 1,
    updated_at = now()
  returning usage_count into v_today_count;

  insert into public.api_quota_counters (api_key_id, period_type, period_start, usage_count, updated_at)
  values (p_api_key_id, 'month', v_month, 1, now())
  on conflict (api_key_id, period_type, period_start)
  do update set
    usage_count = public.api_quota_counters.usage_count + 1,
    updated_at = now()
  returning usage_count into v_month_count;

  update public.api_keys
  set last_used_at = now()
  where id = p_api_key_id;

  return query
  select true, v_daily_quota, v_monthly_quota, v_today_count, v_month_count;
end;
$$;

revoke all on function public.reserve_api_quota(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_api_quota(uuid, uuid, uuid) to service_role;
