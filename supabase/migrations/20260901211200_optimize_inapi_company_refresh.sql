-- Keep the daily INAPI company-activity refresh inside the Vercel cron budget.
-- Both predicates mirror refresh_company_ip_activity_from_sync(p_since).
create index if not exists idx_trademark_records_last_synced_filing
  on public.trademark_records (last_synced_at desc, fecha_presentacion desc)
  where solicitante is not null;

create index if not exists idx_patent_records_last_synced_filing
  on public.patent_records (last_synced_at desc, filing_date desc)
  where applicants is not null;
