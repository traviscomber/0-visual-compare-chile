create table if not exists public.case_copilot_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_start timestamptz not null,
  bucket_type text not null check (bucket_type in ('hour','day')),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket_type, bucket_start)
);

alter table public.case_copilot_rate_limits enable row level security;
revoke all on public.case_copilot_rate_limits from anon, authenticated;

create or replace function public.consume_case_copilot_quota()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_hour timestamptz := date_trunc('hour', now());
  v_day timestamptz := date_trunc('day', now());
  v_hour_count integer;
  v_day_count integer;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  insert into public.case_copilot_rate_limits(user_id,bucket_type,bucket_start,request_count,updated_at)
  values(v_user,'hour',v_hour,1,now())
  on conflict(user_id,bucket_type,bucket_start)
  do update set request_count = public.case_copilot_rate_limits.request_count + 1, updated_at = now()
  returning request_count into v_hour_count;
  insert into public.case_copilot_rate_limits(user_id,bucket_type,bucket_start,request_count,updated_at)
  values(v_user,'day',v_day,1,now())
  on conflict(user_id,bucket_type,bucket_start)
  do update set request_count = public.case_copilot_rate_limits.request_count + 1, updated_at = now()
  returning request_count into v_day_count;
  if v_hour_count > 20 or v_day_count > 100 then
    return jsonb_build_object('allowed',false,'hourCount',v_hour_count,'dayCount',v_day_count,'hourLimit',20,'dayLimit',100);
  end if;
  return jsonb_build_object('allowed',true,'hourCount',v_hour_count,'dayCount',v_day_count,'hourLimit',20,'dayLimit',100);
end;
$$;

revoke all on function public.consume_case_copilot_quota() from public, anon;
grant execute on function public.consume_case_copilot_quota() to authenticated;
