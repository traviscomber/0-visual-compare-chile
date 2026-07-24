-- Durable background-processing queue for image analysis.

begin;

alter table public.images
  add column if not exists processing_status text not null default 'completed',
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz;

alter table public.images
  drop constraint if exists images_processing_status_check;

alter table public.images
  add constraint images_processing_status_check
  check (processing_status in ('queued', 'processing', 'completed', 'failed'));

update public.images
set processed_at = coalesce(processed_at, created_at, now())
where processing_status = 'completed' and processed_at is null;

create table if not exists public.image_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references public.images(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  priority smallint not null default 100,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (image_id)
);

create index if not exists image_processing_jobs_claim_idx
  on public.image_processing_jobs (priority, available_at, created_at)
  where status = 'queued';

create index if not exists image_processing_jobs_stale_idx
  on public.image_processing_jobs (locked_at)
  where status = 'processing';

alter table public.image_processing_jobs enable row level security;
alter table public.image_processing_jobs force row level security;

revoke all on table public.image_processing_jobs from public, anon, authenticated;
grant all on table public.image_processing_jobs to service_role;

create or replace function public.enqueue_image_processing_job(
  p_image_id uuid,
  p_user_id uuid,
  p_priority smallint default 100
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job_id uuid;
begin
  insert into public.image_processing_jobs (image_id, user_id, priority)
  values (p_image_id, p_user_id, p_priority)
  on conflict (image_id) do update
    set status = case
      when public.image_processing_jobs.status in ('failed', 'completed') then 'queued'
      else public.image_processing_jobs.status
    end,
    available_at = case
      when public.image_processing_jobs.status in ('failed', 'completed') then now()
      else public.image_processing_jobs.available_at
    end,
    last_error = case
      when public.image_processing_jobs.status in ('failed', 'completed') then null
      else public.image_processing_jobs.last_error
    end,
    updated_at = now()
  returning id into v_job_id;

  update public.images
  set processing_status = 'queued', processing_error = null, processed_at = null
  where id = p_image_id and user_id = p_user_id;

  return v_job_id;
end;
$$;

create or replace function public.claim_image_processing_jobs(
  p_worker_id text,
  p_limit integer default 2
)
returns table (
  job_id uuid,
  image_id uuid,
  user_id uuid,
  attempts integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Recover jobs abandoned by a terminated worker.
  update public.image_processing_jobs
  set status = 'queued',
      locked_at = null,
      locked_by = null,
      available_at = now(),
      updated_at = now(),
      last_error = coalesce(last_error, 'Worker lease expired')
  where status = 'processing'
    and locked_at < now() - interval '10 minutes';

  return query
  with candidates as (
    select j.id
    from public.image_processing_jobs j
    where j.status = 'queued'
      and j.available_at <= now()
      and j.attempts < j.max_attempts
    order by j.priority asc, j.available_at asc, j.created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 2), 10))
  ), claimed as (
    update public.image_processing_jobs j
    set status = 'processing',
        attempts = j.attempts + 1,
        locked_at = now(),
        locked_by = left(coalesce(p_worker_id, 'worker'), 200),
        updated_at = now()
    from candidates c
    where j.id = c.id
    returning j.id, j.image_id, j.user_id, j.attempts
  )
  select c.id, c.image_id, c.user_id, c.attempts from claimed c;
end;
$$;

create or replace function public.complete_image_processing_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.image_processing_jobs
  set status = 'completed', completed_at = now(), locked_at = null,
      locked_by = null, last_error = null, updated_at = now()
  where id = p_job_id and status = 'processing';
end;
$$;

create or replace function public.fail_image_processing_job(
  p_job_id uuid,
  p_error text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_image_id uuid;
  v_attempts integer;
  v_max_attempts integer;
  v_next_status text;
begin
  select image_id, attempts, max_attempts
  into v_image_id, v_attempts, v_max_attempts
  from public.image_processing_jobs
  where id = p_job_id
  for update;

  if not found then
    return 'missing';
  end if;

  v_next_status := case when v_attempts >= v_max_attempts then 'failed' else 'queued' end;

  update public.image_processing_jobs
  set status = v_next_status,
      available_at = case
        when v_next_status = 'queued' then now() + make_interval(mins => least(30, (2 ^ greatest(0, v_attempts - 1))::integer))
        else available_at
      end,
      locked_at = null,
      locked_by = null,
      last_error = left(coalesce(p_error, 'Unknown processing error'), 1000),
      updated_at = now()
  where id = p_job_id;

  update public.images
  set processing_status = v_next_status,
      processing_error = left(coalesce(p_error, 'Unknown processing error'), 1000)
  where id = v_image_id;

  return v_next_status;
end;
$$;

create or replace function public.cleanup_image_processing_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_jobs integer;
  v_limits integer;
begin
  delete from public.image_processing_jobs
  where status in ('completed', 'failed')
    and updated_at < now() - interval '30 days';
  get diagnostics v_jobs = row_count;

  delete from public.image_upload_rate_limits
  where window_start < now() - interval '3 days';
  get diagnostics v_limits = row_count;

  return jsonb_build_object('jobs_deleted', v_jobs, 'quota_rows_deleted', v_limits);
end;
$$;

revoke all on function public.enqueue_image_processing_job(uuid, uuid, smallint) from public, anon, authenticated;
revoke all on function public.claim_image_processing_jobs(text, integer) from public, anon, authenticated;
revoke all on function public.complete_image_processing_job(uuid) from public, anon, authenticated;
revoke all on function public.fail_image_processing_job(uuid, text) from public, anon, authenticated;
revoke all on function public.cleanup_image_processing_data() from public, anon, authenticated;

grant execute on function public.enqueue_image_processing_job(uuid, uuid, smallint) to service_role;
grant execute on function public.claim_image_processing_jobs(text, integer) to service_role;
grant execute on function public.complete_image_processing_job(uuid) to service_role;
grant execute on function public.fail_image_processing_job(uuid, text) to service_role;
grant execute on function public.cleanup_image_processing_data() to service_role;

commit;
