create or replace function public.search_inapi_local(
  p_query text,
  p_niza_codes text[] default '{}',
  p_limit integer default 20
)
returns table (
  id uuid,
  nombre text,
  solicitante text,
  numero_registro text,
  numero_solicitud text,
  estado text,
  fecha_presentacion date,
  fecha_registro date,
  niza_codes text[],
  source_record_id text,
  source_url text,
  last_synced_at timestamptz,
  name_similarity real,
  exact_name boolean,
  class_overlap integer,
  relevance_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select upper(trim(coalesce(p_query, ''))) as q,
           greatest(1, least(coalesce(p_limit, 20), 50)) as lim
  ), candidates as (
    select tr.*
    from public.trademark_records tr
    cross join params
    where tr.source = 'inapi'
      and params.q <> ''
      and tr.nombre % params.q
    order by similarity(tr.nombre, params.q) desc
    limit 250
  ), ranked as (
    select
      tr.id,
      tr.nombre,
      tr.solicitante,
      tr.numero_registro,
      tr.numero_solicitud,
      tr.estado,
      tr.fecha_presentacion,
      tr.fecha_registro,
      coalesce(array_agg(distinct trn.code) filter (where trn.code is not null), '{}') as niza_codes,
      tr.source_record_id,
      tr.source_url,
      tr.last_synced_at,
      similarity(tr.nombre, params.q)::real as name_similarity,
      upper(trim(tr.nombre)) = params.q as exact_name,
      count(distinct trn.code) filter (where trn.code = any(coalesce(p_niza_codes, '{}')))::integer as class_overlap,
      (
        case when upper(trim(tr.nombre)) = params.q then 55 else 0 end
        + similarity(tr.nombre, params.q) * 35
        + least(20, count(distinct trn.code) filter (where trn.code = any(coalesce(p_niza_codes, '{}'))) * 10)
        + case when tr.estado in ('Registrada', 'Pendiente', 'En Tramite') then 10 else 0 end
      )::numeric as relevance_score
    from candidates tr
    cross join params
    left join public.trademark_record_niza trn on trn.trademark_record_id = tr.id
    group by tr.id, tr.nombre, tr.solicitante, tr.numero_registro, tr.numero_solicitud, tr.estado,
      tr.fecha_presentacion, tr.fecha_registro, tr.source_record_id, tr.source_url, tr.last_synced_at, params.q
  )
  select *
  from ranked
  order by relevance_score desc, fecha_presentacion desc nulls last
  limit (select lim from params);
$$;

revoke all on function public.search_inapi_local(text,text[],integer) from public;
grant execute on function public.search_inapi_local(text,text[],integer) to service_role;
