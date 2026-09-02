create table if not exists public.organization_intelligence_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  website text,
  company_summary text,
  industry text,
  country text,
  offerings jsonb not null default '[]'::jsonb,
  capabilities jsonb not null default '[]'::jsonb,
  discovery_goals text[] not null default '{}'::text[],
  strategic_focus text,
  onboarding_step smallint not null default 1 check (onboarding_step between 1 and 4),
  onboarding_version integer not null default 1,
  profile_completeness smallint not null default 0 check (profile_completeness between 0 and 100),
  onboarding_completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_intelligence_profiles_offerings_array check (jsonb_typeof(offerings) = 'array'),
  constraint organization_intelligence_profiles_capabilities_array check (jsonb_typeof(capabilities) = 'array')
);

alter table public.organization_intelligence_profiles enable row level security;

revoke all on table public.organization_intelligence_profiles from anon, authenticated;
grant select, insert, update, delete on table public.organization_intelligence_profiles to service_role;

drop policy if exists organization_intelligence_profiles_service_role on public.organization_intelligence_profiles;
create policy organization_intelligence_profiles_service_role
  on public.organization_intelligence_profiles
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.organization_intelligence_profiles is
  'Progressive strategic profile used to personalize Videntia research and recommendations per organization.';
comment on column public.organization_intelligence_profiles.metadata is
  'Non-canonical enrichment details such as website analysis provenance and future optional onboarding fields.';
