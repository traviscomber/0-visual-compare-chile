create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('case_created','status_changed','priority_changed','decision_changed','notes_changed','review_checkpoint','item_added','item_removed')),
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists case_events_case_id_occurred_at_idx on public.case_events(case_id, occurred_at desc);
create index if not exists case_events_user_id_occurred_at_idx on public.case_events(user_id, occurred_at desc);
alter table public.case_events enable row level security;
drop policy if exists "case_events_select_own" on public.case_events;
create policy "case_events_select_own" on public.case_events for select using (user_id = auth.uid());
revoke insert, update, delete on public.case_events from authenticated, anon;
grant select on public.case_events to authenticated;

create or replace function public.audit_case_changes() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at)
    values (new.id,new.user_id,'case_created','Caso creado',jsonb_build_object('status',new.status,'priority',new.priority,'context_type',new.context_type,'context_query',new.context_query),new.created_at);
    return new;
  end if;
  if new.status is distinct from old.status then insert into public.case_events(case_id,user_id,event_type,title,payload) values (new.id,new.user_id,'status_changed','Estado actualizado',jsonb_build_object('from',old.status,'to',new.status)); end if;
  if new.priority is distinct from old.priority then insert into public.case_events(case_id,user_id,event_type,title,payload) values (new.id,new.user_id,'priority_changed','Prioridad actualizada',jsonb_build_object('from',old.priority,'to',new.priority)); end if;
  if new.decision_summary is distinct from old.decision_summary then insert into public.case_events(case_id,user_id,event_type,title,payload) values (new.id,new.user_id,'decision_changed',case when new.decision_summary is null then 'Decisión retirada' else 'Decisión registrada' end,jsonb_build_object('has_decision',new.decision_summary is not null)); end if;
  if new.notes is distinct from old.notes then insert into public.case_events(case_id,user_id,event_type,title,payload) values (new.id,new.user_id,'notes_changed','Notas actualizadas',jsonb_build_object('has_notes',new.notes is not null)); end if;
  if new.last_reviewed_at is distinct from old.last_reviewed_at and new.last_reviewed_at is not null then insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at) values (new.id,new.user_id,'review_checkpoint','Caso marcado como revisado','{}'::jsonb,new.last_reviewed_at); end if;
  return new;
end;
$$;
drop trigger if exists audit_case_changes_trigger on public.cases;
create trigger audit_case_changes_trigger after insert or update on public.cases for each row execute function public.audit_case_changes();

create or replace function public.audit_case_item_changes() returns trigger
language plpgsql security definer set search_path = public
as $$
declare owner_id uuid;
begin
  if tg_op = 'INSERT' then
    select user_id into owner_id from public.cases where id = new.case_id;
    insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at) values (new.case_id,owner_id,'item_added','Evidencia agregada',jsonb_build_object('item_id',new.id,'item_type',new.item_type,'title',new.title),new.created_at);
    return new;
  else
    select user_id into owner_id from public.cases where id = old.case_id;
    if owner_id is not null then insert into public.case_events(case_id,user_id,event_type,title,payload) values (old.case_id,owner_id,'item_removed','Evidencia retirada',jsonb_build_object('item_id',old.id,'item_type',old.item_type,'title',old.title)); end if;
    return old;
  end if;
end;
$$;
drop trigger if exists audit_case_item_changes_trigger on public.case_items;
create trigger audit_case_item_changes_trigger after insert or delete on public.case_items for each row execute function public.audit_case_item_changes();

insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at)
select c.id,c.user_id,'case_created','Caso creado',jsonb_build_object('status',c.status,'priority',c.priority,'context_type',c.context_type,'context_query',c.context_query),c.created_at from public.cases c
where not exists (select 1 from public.case_events e where e.case_id=c.id and e.event_type='case_created');
insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at)
select ci.case_id,c.user_id,'item_added','Evidencia agregada',jsonb_build_object('item_id',ci.id,'item_type',ci.item_type,'title',ci.title),ci.created_at from public.case_items ci join public.cases c on c.id=ci.case_id
where not exists (select 1 from public.case_events e where e.case_id=ci.case_id and e.event_type='item_added' and e.payload->>'item_id'=ci.id::text);
insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at)
select c.id,c.user_id,'review_checkpoint','Último checkpoint conocido','{}'::jsonb,c.last_reviewed_at from public.cases c where c.last_reviewed_at is not null
and not exists (select 1 from public.case_events e where e.case_id=c.id and e.event_type='review_checkpoint' and e.occurred_at=c.last_reviewed_at);