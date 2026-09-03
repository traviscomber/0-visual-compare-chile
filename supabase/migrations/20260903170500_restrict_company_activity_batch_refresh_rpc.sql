-- Restrict the privileged company activity batch refresh to backend service execution.
revoke execute on function public.refresh_company_ip_activity_from_sync_batch(timestamptz, integer)
  from public, anon, authenticated;

grant execute on function public.refresh_company_ip_activity_from_sync_batch(timestamptz, integer)
  to service_role;
