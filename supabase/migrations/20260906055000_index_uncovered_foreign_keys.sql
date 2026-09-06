create index if not exists intelligence_recommendations_own_identity_idx
  on public.intelligence_recommendations (own_identity_id);

create index if not exists organization_intelligence_profiles_created_by_idx
  on public.organization_intelligence_profiles (created_by);

create index if not exists organization_intelligence_profiles_updated_by_idx
  on public.organization_intelligence_profiles (updated_by);
