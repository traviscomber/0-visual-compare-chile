-- Atomic API quota reservation.
-- This migration adds a transactional RPC used before expensive API work.
-- It does not modify or delete historical usage data.

create or replace function public.reserve_api_quota(
  p_api_key_id uuid,
  p_organization_id uuid,
  p_user_id uuid,
  p_action text default 'api.request.reserved'
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
  v_today_count bigint;
  v_month_count bigint;
  v_now timestamptz := now();
  v_today timestamptz := date_trunc('day', v_now);
  v_month timestamptz := date_trunc('month', v_now);
begin
  -- Serialize reservations for one API key without locking unrelated tenants.
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
    and (ak.expires_at is null or ak.expires_at > v_now)
  for update;

  if not found then
    return query select false, 0, 0, 0::bigint, 0::bigint;
    return;
  end if;

  select count(*)
  into v_today_count
  from public.usage_logs ul
  where ul.organization_id = p_organization_id
    and ul.metadata @> jsonb_build_object('api_key_id', p_api_key_id::text)
    and ul.created_at >= v_today;

  select count(*)
  into v_month_count
  from public.usage_logs ul
  where ul.organization_id = p_organization_id
    and ul.metadata @> jsonb_build_object('api_key_id', p_api_key_id::text)
    and ul.created_at >= v_month;

  if v_today_count >= v_daily_quota or v_month_count >= v_monthly_quota then
    return query select false, v_daily_quota, v_monthly_quota, v_today_count, v_month_count;
    return;
  end if;

  insert into public.usage_logs (
    user_id,
    organization_id,
    action,
    metadata
  ) values (
    p_user_id,
    p_organization_id,
    p_action,
    jsonb_build_object(
      'api_key_id', p_api_key_id::text,
      'reservation', true
    )
  );

  update public.api_keys
  set last_used_at = v_now
  where id = p_api_key_id;

  return query
  select true, v_daily_quota, v_monthly_quota, v_today_count + 1, v_month_count + 1;
end;
$$;

revoke all on function public.reserve_api_quota(uuid, uuid, uuid, text) from public;
grant execute on function public.reserve_api_quota(uuid, uuid, uuid, text) to service_role;
