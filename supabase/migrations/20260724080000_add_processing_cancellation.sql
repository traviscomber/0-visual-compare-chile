begin;

alter table public.image_processing_jobs
  drop constraint if exists image_processing_jobs_status_check;

alter table public.image_processing_jobs
  add constraint image_processing_jobs_status_check
  check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled'));

alter table public.images
  drop constraint if exists images_processing_status_check;

alter table public.images
  add constraint images_processing_status_check
  check (processing_status in ('queued', 'processing', 'completed', 'failed', 'cancelled'));

create or replace function public.cancel_my_image_processing_job(p_job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_image_id uuid;
  v_previous_status text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select image_id, status
  into v_image_id, v_previous_status
  from public.image_processing_jobs
  where id = p_job_id
    and user_id = v_user_id
  for update;

  if not found then
    return jsonb_build_object('cancelled', false, 'reason', 'not_found');
  end if;

  if v_previous_status not in ('queued', 'processing') then
    return jsonb_build_object(
      'cancelled', false,
      'reason', 'not_cancellable',
      'status', v_previous_status
    );
  end if;

  update public.image_processing_jobs
  set status = 'cancelled',
      locked_at = null,
      locked_by = null,
      last_error = 'Cancelado por el usuario.',
      completed_at = now(),
      updated_at = now()
  where id = p_job_id
    and user_id = v_user_id
    and status in ('queued', 'processing');

  update public.images
  set processing_status = 'cancelled',
      processing_error = 'Cancelado por el usuario.',
      processed_at = now()
  where id = v_image_id
    and user_id = v_user_id;

  return jsonb_build_object(
    'cancelled', true,
    'job_id', p_job_id,
    'previous_status', v_previous_status
  );
end;
$$;

-- A worker may finish after the user cancels a processing job. Keep cancellation
-- authoritative by only completing or failing jobs that are still processing.
create or replace function public.complete_image_processing_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.image_processing_jobs
  set status = 'completed',
      completed_at = now(),
      locked_at = null,
      locked_by = null,
      last_error = null,
      updated_at = now()
  where id = p_job_id
    and status = 'processing';
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
  v_current_status text;
  v_next_status text;
begin
  select image_id, attempts, max_attempts, status
  into v_image_id, v_attempts, v_max_attempts, v_current_status
  from public.image_processing_jobs
  where id = p_job_id
  for update;

  if not found then
    return 'missing';
  end if;

  if v_current_status = 'cancelled' then
    return 'cancelled';
  end if;

  if v_current_status <> 'processing' then
    return v_current_status;
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
  where id = p_job_id
    and status = 'processing';

  update public.images
  set processing_status = v_next_status,
      processing_error = left(coalesce(p_error, 'Unknown processing error'), 1000)
  where id = v_image_id
    and processing_status <> 'cancelled';

  return v_next_status;
end;
$$;

create or replace function public.get_my_image_processing_metrics()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  with mine as (
    select j.*
    from public.image_processing_jobs j
    where j.user_id = auth.uid()
  ), aggregates as (
    select
      count(*) filter (where status = 'queued')::integer as queued,
      count(*) filter (where status = 'processing')::integer as processing,
      count(*) filter (where status = 'completed')::integer as completed,
      count(*) filter (where status = 'failed')::integer as failed,
      count(*) filter (where status = 'cancelled')::integer as cancelled,
      count(*) filter (where attempts > 1)::integer as retried,
      count(distinct locked_by) filter (where status = 'processing' and locked_by is not null)::integer as active_workers,
      coalesce(round(avg(extract(epoch from (completed_at - created_at))) filter (where status = 'completed' and completed_at is not null)::numeric, 2), 0) as avg_processing_seconds,
      count(*) filter (where status = 'completed' and completed_at >= now() - interval '1 hour')::integer as throughput_last_hour,
      coalesce(max(extract(epoch from (now() - created_at))) filter (where status = 'queued'), 0)::integer as oldest_queued_seconds
    from mine
  ), recent as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id,
      'image_id', image_id,
      'status', status,
      'attempts', attempts,
      'max_attempts', max_attempts,
      'created_at', created_at,
      'updated_at', updated_at,
      'completed_at', completed_at,
      'last_error', last_error
    ) order by updated_at desc), '[]'::jsonb) as jobs
    from (
      select * from mine order by updated_at desc limit 25
    ) r
  )
  select jsonb_build_object(
    'queued', a.queued,
    'processing', a.processing,
    'completed', a.completed,
    'failed', a.failed,
    'cancelled', a.cancelled,
    'retried', a.retried,
    'active_workers', a.active_workers,
    'avg_processing_seconds', a.avg_processing_seconds,
    'throughput_last_hour', a.throughput_last_hour,
    'oldest_queued_seconds', a.oldest_queued_seconds,
    'recent_jobs', r.jobs
  )
  from aggregates a cross join recent r;
$$;

revoke all on function public.cancel_my_image_processing_job(uuid) from public, anon;
grant execute on function public.cancel_my_image_processing_job(uuid) to authenticated;

revoke all on function public.complete_image_processing_job(uuid) from public, anon, authenticated;
revoke all on function public.fail_image_processing_job(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_image_processing_job(uuid) to service_role;
grant execute on function public.fail_image_processing_job(uuid, text) to service_role;

commit;
