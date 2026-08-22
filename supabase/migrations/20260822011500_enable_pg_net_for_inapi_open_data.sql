-- Enables outbound HTTP from Supabase for controlled INAPI open-data refresh operations.
-- Runtime application traffic does not depend on pg_net; the regular sync script uses Node fetch.
create extension if not exists pg_net with schema extensions;
