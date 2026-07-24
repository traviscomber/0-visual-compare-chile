-- Harden image ownership, deduplication, and private object access.
-- Service-role requests bypass RLS, so server-side upload and cleanup continue to work.

begin;

-- Prevent two active copies of the same binary for the same user.
create unique index if not exists images_user_sha256_active_uidx
  on public.images (user_id, sha256)
  where status = 'active' and sha256 is not null;

alter table public.images enable row level security;
alter table public.images force row level security;

-- Restrictive policies constrain any older permissive policies that may exist.
drop policy if exists images_owner_select_restrictive on public.images;
create policy images_owner_select_restrictive
  on public.images
  as restrictive
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists images_owner_insert_restrictive on public.images;
create policy images_owner_insert_restrictive
  on public.images
  as restrictive
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists images_owner_update_restrictive on public.images;
create policy images_owner_update_restrictive
  on public.images
  as restrictive
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists images_owner_delete_restrictive on public.images;
create policy images_owner_delete_restrictive
  on public.images
  as restrictive
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Explicit grants for authenticated owners.
drop policy if exists images_owner_select on public.images;
create policy images_owner_select
  on public.images
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists images_owner_insert on public.images;
create policy images_owner_insert
  on public.images
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists images_owner_update on public.images;
create policy images_owner_update
  on public.images
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists images_owner_delete on public.images;
create policy images_owner_delete
  on public.images
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Keep the image bucket private even if it already existed with a different setting.
insert into storage.buckets (id, name, public)
values ('comparison-images', 'comparison-images', false)
on conflict (id) do update
set public = false;

-- A user may only read objects stored below their own UUID prefix.
-- Writes remain server-only through the service role.
drop policy if exists comparison_images_owner_select_restrictive on storage.objects;
create policy comparison_images_owner_select_restrictive
  on storage.objects
  as restrictive
  for select
  to authenticated
  using (
    bucket_id <> 'comparison-images'
    or (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists comparison_images_owner_select on storage.objects;
create policy comparison_images_owner_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'comparison-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- These restrictive policies prevent authenticated clients from writing to the
-- private image bucket even if an older broad policy remains in the project.
drop policy if exists comparison_images_server_insert_only on storage.objects;
create policy comparison_images_server_insert_only
  on storage.objects
  as restrictive
  for insert
  to authenticated
  with check (bucket_id <> 'comparison-images');

drop policy if exists comparison_images_server_update_only on storage.objects;
create policy comparison_images_server_update_only
  on storage.objects
  as restrictive
  for update
  to authenticated
  using (bucket_id <> 'comparison-images')
  with check (bucket_id <> 'comparison-images');

drop policy if exists comparison_images_server_delete_only on storage.objects;
create policy comparison_images_server_delete_only
  on storage.objects
  as restrictive
  for delete
  to authenticated
  using (bucket_id <> 'comparison-images');

commit;
