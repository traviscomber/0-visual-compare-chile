insert into public.intelligence_sources (source_key,name,authority,base_url,source_type,license,freshness_policy,is_active,metadata)
values (
  'google_news_rss',
  'Google News RSS',
  'Google',
  'https://news.google.com/rss/search',
  'public_api',
  null,
  'bajo_demanda',
  true,
  jsonb_build_object('domain','news_signals','automation_allowed',true,'role','context_only')
)
on conflict (source_key) do update set
  name=excluded.name,
  authority=excluded.authority,
  base_url=excluded.base_url,
  source_type=excluded.source_type,
  freshness_policy=excluded.freshness_policy,
  is_active=true,
  metadata=excluded.metadata,
  updated_at=now();

update public.intelligence_sources
set is_active=false,
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'operational_status','disabled_runtime_connectivity',
      'reason','Vercel production repeatedly times out connecting to api.gdeltproject.org; Google News RSS is the operational public-context source.'
    ),
    updated_at=now()
where source_key='gdelt';
