with inapi as (
  select s.id as source_id,
         greatest(
           coalesce((select max(last_synced_at) from public.trademark_records where source='inapi'), '-infinity'::timestamptz),
           coalesce((select max(last_synced_at) from public.patent_records where source='inapi'), '-infinity'::timestamptz)
         ) as observed_at
  from public.intelligence_sources s where s.source_key='inapi_open_data'
), valid_inapi as (
  select source_id, observed_at from inapi where observed_at > '-infinity'::timestamptz
)
insert into public.intelligence_source_state(source_id,last_success_at,last_attempt_at,consecutive_failures,circuit_state,last_error,updated_at)
select source_id,observed_at,observed_at,0,'closed',null,now() from valid_inapi
on conflict (source_id) do update set
  last_success_at=excluded.last_success_at,
  last_attempt_at=excluded.last_attempt_at,
  consecutive_failures=0,
  circuit_state='closed',
  circuit_open_until=null,
  last_error=null,
  updated_at=now();

with tdpi as (
  select s.id as source_id,max(e.observed_at) as observed_at
  from public.intelligence_sources s
  join public.intelligence_evidence e on e.source_id=s.id
  where s.source_key='tdpi'
  group by s.id
)
insert into public.intelligence_source_state(source_id,last_success_at,last_attempt_at,consecutive_failures,circuit_state,last_error,updated_at)
select source_id,observed_at,observed_at,0,'closed',null,now() from tdpi where observed_at is not null
on conflict (source_id) do update set
  last_success_at=excluded.last_success_at,
  last_attempt_at=excluded.last_attempt_at,
  consecutive_failures=0,
  circuit_state='closed',
  circuit_open_until=null,
  last_error=null,
  updated_at=now();
