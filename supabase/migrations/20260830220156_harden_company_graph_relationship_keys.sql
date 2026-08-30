create index if not exists intelligence_company_relationships_source_idx
  on public.intelligence_company_relationships (evidence_source_key, observed_at desc)
  where evidence_source_key is not null;

alter table public.intelligence_company_relationships
  drop constraint if exists intelligence_company_relation_from_identity_id_to_identity__key;

create unique index if not exists intelligence_company_relationships_evidence_uq
  on public.intelligence_company_relationships (
    from_identity_id,
    to_identity_id,
    relationship_type,
    coalesce(evidence_source_key, ''),
    coalesce(evidence_record_id, '')
  );
