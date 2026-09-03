-- Post-deploy cleanup for source-aware patent watches.
-- Apply only after the application version using
-- (user_id, watch_type, normalized_query, source_type) is live.
alter table public.patent_watches
  drop constraint if exists patent_watches_user_id_watch_type_normalized_query_key;
