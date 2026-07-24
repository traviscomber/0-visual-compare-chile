-- Operational metrics and alerting for the image-processing queue.

begin;

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
      count(*) filter (where attempts > 1)::integer as retried,
      count(distinct locked_by) filter (where status = 'processing' and locked_by is not null)::integer as active_workers,
      coalesce(round(avg(extract(epoch from (completed_at - created_at))) filter (where completed_at is not null)::numeric, 2), 0) as avg_processing_seconds,
      count(*) filter (where completed_at >= now() - interval '1 hour')::integer as throughput_last_hour,
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
    'retried', a.retried,
    'active_workers', a.active_workers,
    'avg_processing_seconds', a.avg_processing_seconds,
    'throughput_last_hour', a.throughput_last_hour,
    'oldest_queued_seconds', a.oldest_queued_seconds,
    'recent_jobs', r.jobs
  )
  from aggregates a cross join recent r;
$$;

create or replace function public.get_image_processing_health()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  with stats as (
    select
      count(*) filter (where status = 'queued')::integer as queued,
      count(*) filter (where status = 'processing')::integer as processing,
      count(*) filter (where status = 'failed' and updated_at >= now() - interval '1 hour')::integer as failures_last_hour,
      count(*) filter (where completed_at >= now() - interval '1 hour')::integer as completed_last_hour,
      coalesce(max(extract(epoch from (now() - created_at))) filter (where status = 'queued'), 0)::integer as oldest_queued_seconds,
      count(*) filter (where status = 'processing' and locked_at < now() - interval '8 minutes')::integer as expiring_leases
    from public.image_processing_jobs
  )
  select jsonb_build_object(
    'status', case
      when failures_last_hour >= 10 or oldest_queued_seconds >= 1800 then 'critical'
      when failures_last_hour >= 3 or oldest_queued_seconds >= 600 or expiring_leases > 0 then 'warning'
      else 'healthy'
    end,
    'queued', queued,
    'processing', processing,
    'failures_last_hour', failures_last_hour,
    'completed_last_hour', completed_last_hour,
    'oldest_queued_seconds', oldest_queued_seconds,
    'expiring_leases', expiring_leases,
    'checked_at', now()
  )
  from stats;
$$;

revoke all on function public.get_my_image_processing_metrics() from public, anon;
grant execute on function public.get_my_image_processing_metrics() to authenticated;

revoke all on function public.get_image_processing_health() from public, anon, authenticated;
grant execute on function public.get_image_processing_health() to service_role;

commit;
