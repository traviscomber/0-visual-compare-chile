create table if not exists public.case_members (
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (case_id, user_id)
);

create table if not exists public.case_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  mentions uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open','done')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create or replace function public.case_access_role(p_case_id uuid, p_user_id uuid default auth.uid())
returns text language sql stable security definer set search_path=public as $$
  select case when c.user_id=p_user_id then 'owner'
    else (select cm.role from public.case_members cm where cm.case_id=c.id and cm.user_id=p_user_id limit 1) end
  from public.cases c where c.id=p_case_id
$$;
revoke all on function public.case_access_role(uuid,uuid) from public;
grant execute on function public.case_access_role(uuid,uuid) to authenticated;

create index if not exists case_members_user_idx on public.case_members(user_id,case_id);
create index if not exists case_comments_case_idx on public.case_comments(case_id,created_at desc);
create index if not exists case_comments_mentions_gin on public.case_comments using gin(mentions);
create index if not exists case_actions_assignee_idx on public.case_actions(assigned_to,status,created_at desc);
create index if not exists case_actions_case_idx on public.case_actions(case_id,status,created_at desc);

insert into public.case_members(case_id,user_id,role,added_by,created_at)
select id,user_id,'owner',user_id,created_at from public.cases
on conflict(case_id,user_id) do update set role='owner';

create or replace function public.ensure_case_owner_member()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.case_members(case_id,user_id,role,added_by) values(new.id,new.user_id,'owner',new.user_id)
 on conflict(case_id,user_id) do update set role='owner'; return new;
end $$;
drop trigger if exists trg_case_owner_member on public.cases;
create trigger trg_case_owner_member after insert on public.cases for each row execute function public.ensure_case_owner_member();

create or replace function public.add_case_member_by_email(p_case_id uuid,p_email text,p_role text default 'viewer')
returns table(user_id uuid,email text,display_name text,role text)
language plpgsql security definer set search_path=public,auth as $$
declare v_owner uuid; v_user uuid; v_email text; v_name text; v_role text;
begin
 select c.user_id into v_owner from public.cases c where c.id=p_case_id;
 if v_owner is null or v_owner<>auth.uid() then raise exception 'not_allowed'; end if;
 v_role:=case when p_role='editor' then 'editor' else 'viewer' end;
 select u.id,u.email,coalesce(p.full_name,u.raw_user_meta_data->>'name',split_part(u.email,'@',1))
 into v_user,v_email,v_name from auth.users u left join public.profiles p on p.id=u.id
 where lower(u.email)=lower(trim(p_email)) limit 1;
 if v_user is null then raise exception 'user_not_found'; end if;
 if v_user=v_owner then raise exception 'already_owner'; end if;
 insert into public.case_members(case_id,user_id,role,added_by) values(p_case_id,v_user,v_role,auth.uid())
 on conflict(case_id,user_id) do update set role=excluded.role,added_by=auth.uid();
 return query select v_user,v_email,v_name,v_role;
end $$;
revoke all on function public.add_case_member_by_email(uuid,text,text) from public;
grant execute on function public.add_case_member_by_email(uuid,text,text) to authenticated;

create or replace function public.get_case_members(p_case_id uuid)
returns table(user_id uuid,email text,display_name text,role text,is_owner boolean)
language plpgsql security definer set search_path=public,auth as $$
begin
 if public.case_access_role(p_case_id,auth.uid()) is null then raise exception 'not_allowed'; end if;
 return query select cm.user_id,u.email,coalesce(p.full_name,u.raw_user_meta_data->>'name',split_part(u.email,'@',1)),cm.role,(cm.role='owner')
 from public.case_members cm join auth.users u on u.id=cm.user_id left join public.profiles p on p.id=cm.user_id
 where cm.case_id=p_case_id
 order by case cm.role when 'owner' then 0 when 'editor' then 1 else 2 end,coalesce(p.full_name,u.email);
end $$;
revoke all on function public.get_case_members(uuid) from public;
grant execute on function public.get_case_members(uuid) to authenticated;

alter table public.case_members enable row level security;
alter table public.case_comments enable row level security;
alter table public.case_actions enable row level security;

create policy case_members_select_accessible on public.case_members for select to authenticated using(public.case_access_role(case_id,auth.uid()) is not null);
create policy case_members_insert_owner on public.case_members for insert to authenticated with check(public.case_access_role(case_id,auth.uid())='owner' and role in ('editor','viewer'));
create policy case_members_update_owner on public.case_members for update to authenticated using(public.case_access_role(case_id,auth.uid())='owner' and role<>'owner') with check(public.case_access_role(case_id,auth.uid())='owner' and role in ('editor','viewer'));
create policy case_members_delete_owner on public.case_members for delete to authenticated using(public.case_access_role(case_id,auth.uid())='owner' and role<>'owner');
create policy case_comments_select_accessible on public.case_comments for select to authenticated using(public.case_access_role(case_id,auth.uid()) is not null);
create policy case_comments_insert_accessible on public.case_comments for insert to authenticated with check(author_id=auth.uid() and public.case_access_role(case_id,auth.uid()) is not null);
create policy case_comments_update_own on public.case_comments for update to authenticated using(author_id=auth.uid() and public.case_access_role(case_id,auth.uid()) is not null) with check(author_id=auth.uid() and public.case_access_role(case_id,auth.uid()) is not null);
create policy case_comments_delete_own on public.case_comments for delete to authenticated using(author_id=auth.uid() and public.case_access_role(case_id,auth.uid()) is not null);
create policy case_actions_select_accessible on public.case_actions for select to authenticated using(public.case_access_role(case_id,auth.uid()) is not null);
create policy case_actions_insert_editor on public.case_actions for insert to authenticated with check(created_by=auth.uid() and public.case_access_role(case_id,auth.uid()) in ('owner','editor'));
create policy case_actions_update_editor_or_assignee on public.case_actions for update to authenticated using(public.case_access_role(case_id,auth.uid()) in ('owner','editor') or assigned_to=auth.uid()) with check(public.case_access_role(case_id,auth.uid()) is not null);
create policy case_actions_delete_editor on public.case_actions for delete to authenticated using(public.case_access_role(case_id,auth.uid()) in ('owner','editor'));

create policy cases_select_collaborator on public.cases for select to authenticated using(public.case_access_role(id,auth.uid()) is not null);
create policy cases_update_collaborator on public.cases for update to authenticated using(public.case_access_role(id,auth.uid()) in ('owner','editor')) with check(public.case_access_role(id,auth.uid()) in ('owner','editor'));
create policy case_items_select_collaborator on public.case_items for select to authenticated using(public.case_access_role(case_id,auth.uid()) is not null);
create policy case_items_insert_collaborator on public.case_items for insert to authenticated with check(public.case_access_role(case_id,auth.uid()) in ('owner','editor'));
create policy case_items_update_collaborator on public.case_items for update to authenticated using(public.case_access_role(case_id,auth.uid()) in ('owner','editor')) with check(public.case_access_role(case_id,auth.uid()) in ('owner','editor'));
create policy case_items_delete_collaborator on public.case_items for delete to authenticated using(public.case_access_role(case_id,auth.uid()) in ('owner','editor'));
create policy case_events_select_collaborator on public.case_events for select to authenticated using(public.case_access_role(case_id,auth.uid()) is not null);

alter table public.case_events drop constraint if exists case_events_event_type_check;
alter table public.case_events add constraint case_events_event_type_check check(event_type in ('case_created','status_changed','priority_changed','decision_changed','notes_changed','review_checkpoint','item_added','item_removed','member_added','member_removed','comment_added','action_added','action_completed'));

create or replace function public.log_case_collaboration_event()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_case uuid; v_owner uuid; v_type text; v_title text; v_payload jsonb; v_actor uuid;
begin
 v_actor:=auth.uid();
 if tg_table_name='case_members' then v_case:=coalesce(new.case_id,old.case_id);
   if tg_op='INSERT' and new.role<>'owner' then v_type:='member_added';v_title:='Participante agregado';v_payload:=jsonb_build_object('member_id',new.user_id,'role',new.role,'actor_id',v_actor);
   elsif tg_op='DELETE' and old.role<>'owner' then v_type:='member_removed';v_title:='Participante retirado';v_payload:=jsonb_build_object('member_id',old.user_id,'role',old.role,'actor_id',v_actor); else return coalesce(new,old); end if;
 elsif tg_table_name='case_comments' and tg_op='INSERT' then v_case:=new.case_id;v_type:='comment_added';v_title:='Comentario agregado';v_payload:=jsonb_build_object('comment_id',new.id,'author_id',new.author_id,'mentions',new.mentions,'actor_id',v_actor);
 elsif tg_table_name='case_actions' then v_case:=coalesce(new.case_id,old.case_id);
   if tg_op='INSERT' then v_type:='action_added';v_title:='Acción asignada';v_payload:=jsonb_build_object('action_id',new.id,'assigned_to',new.assigned_to,'title',new.title,'actor_id',v_actor);
   elsif tg_op='UPDATE' and old.status is distinct from new.status and new.status='done' then v_type:='action_completed';v_title:='Acción completada';v_payload:=jsonb_build_object('action_id',new.id,'assigned_to',new.assigned_to,'title',new.title,'actor_id',v_actor); else return coalesce(new,old); end if;
 else return coalesce(new,old); end if;
 select user_id into v_owner from public.cases where id=v_case;
 insert into public.case_events(case_id,user_id,event_type,title,payload,occurred_at) values(v_case,v_owner,v_type,v_title,coalesce(v_payload,'{}'::jsonb),now());
 return coalesce(new,old);
end $$;
drop trigger if exists trg_case_members_event on public.case_members; create trigger trg_case_members_event after insert or delete on public.case_members for each row execute function public.log_case_collaboration_event();
drop trigger if exists trg_case_comments_event on public.case_comments; create trigger trg_case_comments_event after insert on public.case_comments for each row execute function public.log_case_collaboration_event();
drop trigger if exists trg_case_actions_event on public.case_actions; create trigger trg_case_actions_event after insert or update on public.case_actions for each row execute function public.log_case_collaboration_event();
