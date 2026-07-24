begin;

create or replace function public.retry_my_failed_image_jobs()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_retried integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  with retried as (
    update public.image_processing_jobs j
    set status = 'queued',
        attempts = 0,
        available_at = now(),
        locked_at = null,
        locked_by = null,
        last_error = null,
        completed_at = null,
        updated_at = now()
    where j.user_id = v_user_id
      and j.status = 'failed'
    returning j.image_id
  ), updated_images as (
    update public.images i
    set processing_status = 'queued',
        processing_error = null,
        processed_at = null
    where i.user_id = v_user_id
      and i.id in (select image_id from retried)
    returning i.id
  )
  select count(*) into v_retried from updated_images;

  return jsonb_build_object('retried', v_retried);
end;
$$;

revoke all on function public.retry_my_failed_image_jobs() from public, anon;
grant execute on function public.retry_my_failed_image_jobs() to authenticated;

commit;
