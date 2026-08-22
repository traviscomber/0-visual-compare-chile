create or replace function public.search_inapi_local(
  p_query text,
  p_niza_codes text[] default '{}',
  p_limit integer default 20
)
returns table (
  id uuid,nombre text,solicitante text,numero_registro text,numero_solicitud text,estado text,
  fecha_presentacion date,fecha_registro date,niza_codes text[],source_record_id text,source_url text,
  last_synced_at timestamptz,name_similarity real,exact_name boolean,class_overlap integer,relevance_score numeric
)
language sql stable security definer set search_path=public,extensions
as $$
  with params as (
    select public.normalize_inapi_search_text(trim(coalesce(p_query,''))) q,
           greatest(1,least(coalesce(p_limit,20),50)) lim
  ), candidates as (
    select tr.*,
           similarity(public.normalize_inapi_search_text(tr.nombre),params.q)::real sim,
           public.normalize_inapi_search_text(trim(tr.nombre))=params.q exact_match
    from public.trademark_records tr cross join params
    where tr.source='inapi' and params.q<>''
      and public.normalize_inapi_search_text(trim(coalesce(tr.nombre,'')))<>''
      and (
        public.normalize_inapi_search_text(tr.nombre) % params.q
        or public.normalize_inapi_search_text(tr.nombre) like '%'||params.q||'%'
        or params.q like '%'||public.normalize_inapi_search_text(tr.nombre)||'%'
      )
    order by exact_match desc,sim desc limit 250
  ), ranked as (
    select c.id,c.nombre,c.solicitante,c.numero_registro,c.numero_solicitud,c.estado,
           c.fecha_presentacion,c.fecha_registro,
           coalesce(array_agg(distinct n.code) filter(where n.code is not null),'{}') niza_codes,
           c.source_record_id,c.source_url,c.last_synced_at,c.sim name_similarity,c.exact_match exact_name,
           count(distinct n.code) filter(where n.code=any(coalesce(p_niza_codes,'{}')))::integer class_overlap,
           (case when c.exact_match then 55 else 0 end + c.sim*35
            + least(20,count(distinct n.code) filter(where n.code=any(coalesce(p_niza_codes,'{}')))*10)
            + case when c.estado in ('Registrada','Pendiente','En Tramite') then 10 else 0 end)::numeric relevance_score
    from candidates c left join public.trademark_record_niza n on n.trademark_record_id=c.id
    group by c.id,c.nombre,c.solicitante,c.numero_registro,c.numero_solicitud,c.estado,
             c.fecha_presentacion,c.fecha_registro,c.source_record_id,c.source_url,c.last_synced_at,c.sim,c.exact_match
  )
  select * from ranked order by relevance_score desc,fecha_presentacion desc nulls last limit (select lim from params);
$$;
revoke all on function public.search_inapi_local(text,text[],integer) from public;
grant execute on function public.search_inapi_local(text,text[],integer) to service_role;
