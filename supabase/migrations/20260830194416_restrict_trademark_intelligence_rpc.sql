revoke execute on function public.get_trademark_owner_summary(uuid) from authenticated;
revoke execute on function public.get_trademark_family_context(uuid) from authenticated;
revoke execute on function public.get_trademark_intelligence_context(uuid) from authenticated;
revoke execute on function public.search_trademark_precedents(text, integer[], integer) from authenticated;
