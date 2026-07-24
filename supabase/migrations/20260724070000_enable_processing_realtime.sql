-- Enable authenticated clients to receive processing job changes through
-- Supabase Realtime. Existing row-level security policies continue to define
-- which rows an authenticated user can read.

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'image_processing_jobs'
  ) then
    alter publication supabase_realtime add table public.image_processing_jobs;
  end if;
end
$$;
