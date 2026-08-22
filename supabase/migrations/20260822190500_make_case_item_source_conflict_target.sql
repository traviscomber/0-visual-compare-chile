drop index if exists public.case_items_unique_source_idx;
create unique index if not exists case_items_unique_source_idx on public.case_items(case_id,item_type,source_id);