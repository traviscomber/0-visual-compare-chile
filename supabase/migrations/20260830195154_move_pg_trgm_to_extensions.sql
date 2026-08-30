alter function public.search_patents_local(text, text, integer) set search_path = public, extensions;
alter function public.search_trademark_intelligence_index(text, text[], integer) set search_path = public, extensions, pg_temp;
alter function public.search_trademark_precedents(text, integer[], integer) set search_path = public, extensions, pg_temp;
alter extension pg_trgm set schema extensions;
