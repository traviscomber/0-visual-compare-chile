create table public.intelligence_calibration_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  run_context text not null,
  status text not null check (status in ('insufficient_sample','measured')),
  labeled_count integer not null default 0 check (labeled_count >= 0),
  relevant_count integer not null default 0 check (relevant_count >= 0),
  irrelevant_count integer not null default 0 check (irrelevant_count >= 0),
  false_match_count integer not null default 0 check (false_match_count >= 0),
  identity_incorrect_count integer not null default 0 check (identity_incorrect_count >= 0),
  acceptance_rate numeric(8,6),
  false_positive_rate numeric(8,6),
  by_source jsonb not null default '{}'::jsonb,
  by_event_type jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(period_start, period_end)
);

create index intelligence_calibration_snapshots_created_idx
  on public.intelligence_calibration_snapshots(created_at desc);

alter table public.intelligence_calibration_snapshots enable row level security;
revoke all on public.intelligence_calibration_snapshots from public, anon, authenticated;
grant select, insert, update, delete on public.intelligence_calibration_snapshots to service_role;

create or replace function public.run_intelligence_calibration_snapshot(p_context text default 'scheduled')
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_period_start date := date_trunc('week', current_date)::date;
  v_period_end date := (date_trunc('week', current_date) + interval '6 days')::date;
  v_labeled integer := 0;
  v_relevant integer := 0;
  v_irrelevant integer := 0;
  v_false_match integer := 0;
  v_identity_incorrect integer := 0;
  v_status text;
  v_acceptance numeric;
  v_false_positive numeric;
  v_by_source jsonb := '{}'::jsonb;
  v_by_event_type jsonb := '{}'::jsonb;
  v_snapshot_id uuid;
begin
  select
    count(*)::int,
    count(*) filter (where f.feedback_type='relevant')::int,
    count(*) filter (where f.feedback_type='irrelevant')::int,
    count(*) filter (where f.feedback_type='false_match')::int,
    count(*) filter (where f.feedback_type='identity_incorrect')::int
  into v_labeled,v_relevant,v_irrelevant,v_false_match,v_identity_incorrect
  from public.intelligence_feedback f
  where f.target_type='strategic_watch_event'
    and f.updated_at >= v_period_start::timestamptz
    and f.updated_at < (v_period_end + 1)::timestamptz;

  v_status := case when v_labeled >= 20 then 'measured' else 'insufficient_sample' end;
  v_acceptance := case when v_labeled > 0 then round(v_relevant::numeric / v_labeled::numeric, 6) else null end;
  v_false_positive := case when v_labeled > 0 then round((v_irrelevant + v_false_match + v_identity_incorrect)::numeric / v_labeled::numeric, 6) else null end;

  select coalesce(jsonb_object_agg(source_key, metrics order by source_key), '{}'::jsonb)
  into v_by_source
  from (
    select e.source_key,
           jsonb_build_object(
             'labeled',count(*)::int,
             'relevant',count(*) filter (where f.feedback_type='relevant')::int,
             'irrelevant',count(*) filter (where f.feedback_type='irrelevant')::int,
             'false_match',count(*) filter (where f.feedback_type='false_match')::int,
             'identity_incorrect',count(*) filter (where f.feedback_type='identity_incorrect')::int
           ) as metrics
    from public.intelligence_feedback f
    join public.intelligence_watch_events e
      on e.id::text=f.target_key and e.user_id=f.user_id
    where f.target_type='strategic_watch_event'
      and f.updated_at >= v_period_start::timestamptz
      and f.updated_at < (v_period_end + 1)::timestamptz
    group by e.source_key
  ) s;

  select coalesce(jsonb_object_agg(event_type, metrics order by event_type), '{}'::jsonb)
  into v_by_event_type
  from (
    select e.event_type,
           jsonb_build_object(
             'labeled',count(*)::int,
             'relevant',count(*) filter (where f.feedback_type='relevant')::int,
             'irrelevant',count(*) filter (where f.feedback_type='irrelevant')::int,
             'false_match',count(*) filter (where f.feedback_type='false_match')::int,
             'identity_incorrect',count(*) filter (where f.feedback_type='identity_incorrect')::int
           ) as metrics
    from public.intelligence_feedback f
    join public.intelligence_watch_events e
      on e.id::text=f.target_key and e.user_id=f.user_id
    where f.target_type='strategic_watch_event'
      and f.updated_at >= v_period_start::timestamptz
      and f.updated_at < (v_period_end + 1)::timestamptz
    group by e.event_type
  ) t;

  insert into public.intelligence_calibration_snapshots (
    period_start,period_end,run_context,status,labeled_count,relevant_count,irrelevant_count,
    false_match_count,identity_incorrect_count,acceptance_rate,false_positive_rate,by_source,by_event_type,metadata,updated_at
  ) values (
    v_period_start,v_period_end,coalesce(nullif(trim(p_context),''),'scheduled'),v_status,v_labeled,v_relevant,v_irrelevant,
    v_false_match,v_identity_incorrect,v_acceptance,v_false_positive,v_by_source,v_by_event_type,
    jsonb_build_object('minimum_sample',20,'metric_policy','review_acceptance_not_model_precision'),now()
  )
  on conflict (period_start,period_end) do update set
    run_context=excluded.run_context,
    status=excluded.status,
    labeled_count=excluded.labeled_count,
    relevant_count=excluded.relevant_count,
    irrelevant_count=excluded.irrelevant_count,
    false_match_count=excluded.false_match_count,
    identity_incorrect_count=excluded.identity_incorrect_count,
    acceptance_rate=excluded.acceptance_rate,
    false_positive_rate=excluded.false_positive_rate,
    by_source=excluded.by_source,
    by_event_type=excluded.by_event_type,
    metadata=excluded.metadata,
    updated_at=now()
  returning id into v_snapshot_id;

  return jsonb_build_object(
    'ok',true,
    'snapshotId',v_snapshot_id,
    'periodStart',v_period_start,
    'periodEnd',v_period_end,
    'status',v_status,
    'labeled',v_labeled,
    'acceptanceRate',v_acceptance,
    'falsePositiveRate',v_false_positive,
    'minimumSample',20
  );
end;
$$;

revoke all on function public.run_intelligence_calibration_snapshot(text) from public, anon, authenticated;
grant execute on function public.run_intelligence_calibration_snapshot(text) to service_role;
