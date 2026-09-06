create table if not exists public.intelligence_idea_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  idea_key text not null,
  idea_title text not null,
  evidence_type text not null check (evidence_type in ('news','data','paper','patent','market','regulation','other')),
  title text not null,
  source_url text,
  note text,
  observed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists intelligence_idea_evidence_user_idea_idx
  on public.intelligence_idea_evidence(user_id, idea_key, created_at desc);

create index if not exists intelligence_idea_evidence_org_idx
  on public.intelligence_idea_evidence(organization_id, created_at desc);

create unique index if not exists intelligence_idea_evidence_url_dedupe_idx
  on public.intelligence_idea_evidence(user_id, idea_key, source_url)
  where source_url is not null;

alter table public.intelligence_idea_evidence enable row level security;

revoke all on public.intelligence_idea_evidence from anon, authenticated;
