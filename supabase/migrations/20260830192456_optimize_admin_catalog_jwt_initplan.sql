-- Evaluate auth.jwt() once per statement for admin-only catalog policies.
-- The required app_metadata role remains exactly `admin`.

alter policy config_admin
  on public.configuracion
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy registros_insert_admin
  on public.registros
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy registros_update_admin
  on public.registros
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy registros_delete_admin
  on public.registros
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy marcas_niza_insert_admin
  on public.marcas_niza
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy marcas_niza_update_admin
  on public.marcas_niza
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy marcas_niza_delete_admin
  on public.marcas_niza
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy marcas_viena_insert_admin
  on public.marcas_viena
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy marcas_viena_update_admin
  on public.marcas_viena
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  with check ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');

alter policy marcas_viena_delete_admin
  on public.marcas_viena
  using ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin');
