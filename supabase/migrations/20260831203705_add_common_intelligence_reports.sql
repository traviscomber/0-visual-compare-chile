create table if not exists public.intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null,
  version integer not null check (version > 0),
  created_by uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  vertical text not null check (vertical in ('brand','patent','technology')),
  subject text not null check (char_length(btrim(subject)) between 1 and 240),
  subject_key text not null check (char_length(btrim(subject_key)) between 1 and 240),
  title text not null check (char_length(btrim(title)) between 2 and 240),
  period_start date,
  period_end date,
  what_changed jsonb not null default '[]'::jsonb check (jsonb_typeof(what_changed) = 'array'),
  what_matters jsonb not null default '[]'::jsonb check (jsonb_typeof(what_matters) = 'array'),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  recommended_review jsonb not null default '[]'::jsonb check (jsonb_typeof(recommended_review) = 'array'),
  watch_next jsonb not null default '[]'::jsonb check (jsonb_typeof(watch_next) = 'array'),
  source_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(source_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  constraint intelligence_reports_period_check check (period_start is null or period_end is null or period_end >= period_start),
  constraint intelligence_reports_series_version_key unique(series_id, version)
);

create index if not exists intelligence_reports_creator_created_idx on public.intelligence_reports(created_by, created_at desc);
create index if not exists intelligence_reports_org_created_idx on public.intelligence_reports(organization_id, created_at desc) where organization_id is not null;
create index if not exists intelligence_reports_subject_idx on public.intelligence_reports(created_by, vertical, subject_key, created_at desc);

alter table public.intelligence_reports enable row level security;

revoke all on table public.intelligence_reports from anon;
revoke all on table public.intelligence_reports from authenticated;
grant select, insert, delete on table public.intelligence_reports to authenticated;
grant all on table public.intelligence_reports to service_role;

drop policy if exists intelligence_reports_select on public.intelligence_reports;
create policy intelligence_reports_select on public.intelligence_reports for select to authenticated
using (
  created_by = (select auth.uid())
  or (
    organization_id is not null
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = intelligence_reports.organization_id
        and om.user_id = (select auth.uid())
    )
  )
);

drop policy if exists intelligence_reports_insert on public.intelligence_reports;
create policy intelligence_reports_insert on public.intelligence_reports for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    organization_id is null
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = intelligence_reports.organization_id
        and om.user_id = (select auth.uid())
    )
  )
);

drop policy if exists intelligence_reports_delete on public.intelligence_reports;
create policy intelligence_reports_delete on public.intelligence_reports for delete to authenticated
using (created_by = (select auth.uid()));

create or replace function public.create_intelligence_report_snapshot(
  p_vertical text,
  p_subject text,
  p_title text,
  p_what_changed jsonb,
  p_what_matters jsonb,
  p_evidence jsonb,
  p_recommended_review jsonb,
  p_watch_next jsonb,
  p_source_snapshot jsonb,
  p_organization_id uuid default null,
  p_period_start date default null,
  p_period_end date default null,
  p_series_id uuid default null
)
returns table(id uuid, series_id uuid, version integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_subject text := btrim(coalesce(p_subject,''));
  v_subject_key text;
  v_series uuid := p_series_id;
  v_version integer;
  v_id uuid;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if p_vertical not in ('brand','patent','technology') then raise exception 'invalid_vertical'; end if;
  if char_length(v_subject) < 1 or char_length(v_subject) > 240 then raise exception 'invalid_subject'; end if;
  if char_length(btrim(coalesce(p_title,''))) < 2 or char_length(btrim(p_title)) > 240 then raise exception 'invalid_title'; end if;
  if jsonb_typeof(p_what_changed) <> 'array' or jsonb_typeof(p_what_matters) <> 'array' or jsonb_typeof(p_evidence) <> 'array' or jsonb_typeof(p_recommended_review) <> 'array' or jsonb_typeof(p_watch_next) <> 'array' or jsonb_typeof(p_source_snapshot) <> 'object' then raise exception 'invalid_report_payload'; end if;
  v_subject_key := lower(regexp_replace(v_subject, '[^[:alnum:]]+', ' ', 'g'));
  v_subject_key := regexp_replace(btrim(v_subject_key), '\s+', ' ', 'g');

  if v_series is null then
    select r.series_id into v_series
    from public.intelligence_reports r
    where r.vertical = p_vertical and r.subject_key = v_subject_key
      and coalesce(r.organization_id::text,'') = coalesce(p_organization_id::text,'')
    order by r.created_at desc limit 1;
    if v_series is null then v_series := gen_random_uuid(); end if;
  else
    if not exists (
      select 1 from public.intelligence_reports r
      where r.series_id = v_series and r.vertical = p_vertical and r.subject_key = v_subject_key
        and coalesce(r.organization_id::text,'') = coalesce(p_organization_id::text,'')
    ) then raise exception 'invalid_report_series'; end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_series::text, 0));
  select coalesce(max(r.version),0)+1 into v_version from public.intelligence_reports r where r.series_id = v_series;

  insert into public.intelligence_reports(series_id,version,created_by,organization_id,vertical,subject,subject_key,title,period_start,period_end,what_changed,what_matters,evidence,recommended_review,watch_next,source_snapshot)
  values(v_series,v_version,v_user,p_organization_id,p_vertical,v_subject,v_subject_key,btrim(p_title),p_period_start,p_period_end,p_what_changed,p_what_matters,p_evidence,p_recommended_review,p_watch_next,p_source_snapshot)
  returning intelligence_reports.id into v_id;

  return query select v_id,v_series,v_version;
end;
$$;

revoke all on function public.create_intelligence_report_snapshot(text,text,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,uuid,date,date,uuid) from public, anon;
grant execute on function public.create_intelligence_report_snapshot(text,text,text,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,uuid,date,date,uuid) to authenticated, service_role;
