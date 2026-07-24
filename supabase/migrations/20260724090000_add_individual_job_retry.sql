begin;

create or replace function public.retry_my_image_processing_job(p_job_id uuid)
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
    return jsonb_build_object('retried', false, 'reason', 'not_found');
  end if;

  if v_previous_status not in ('failed', 'cancelled') then
    return jsonb_build_object(
      'retried', false,
      'reason', 'not_retryable',
      'status', v_previous_status
    );
  end if;

  update public.image_processing_jobs
  set status = 'queued',
      attempts = 0,
      available_at = now(),
      locked_at = null,
      locked_by = null,
      last_error = null,
      completed_at = null,
      updated_at = now()
  where id = p_job_id
    and user_id = v_user_id
    and status in ('failed', 'cancelled');

  update public.images
  set processing_status = 'queued',
      processing_error = null,
      processed_at = null
  where id = v_image_id
    and user_id = v_user_id;

  return jsonb_build_object(
    'retried', true,
    'job_id', p_job_id,
    'previous_status', v_previous_status
  );
end;
$$;

revoke all on function public.retry_my_image_processing_job(uuid) from public, anon;
grant execute on function public.retry_my_image_processing_job(uuid) to authenticated;

commit;
