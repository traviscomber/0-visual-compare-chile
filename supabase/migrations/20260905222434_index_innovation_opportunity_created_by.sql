create index if not exists innovation_opportunity_theses_created_by_idx
  on public.innovation_opportunity_theses (created_by);

create index if not exists innovation_opportunity_research_runs_created_by_idx
  on public.innovation_opportunity_research_runs (created_by)
  where created_by is not null;
