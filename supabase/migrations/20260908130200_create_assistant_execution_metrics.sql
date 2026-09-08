create table public.intelligence_assistant_execution_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('direct','canonical_lookup','agentic_research')),
  reason text not null,
  workspace text not null,
  canonical_context_available boolean not null default false,
  requires_fresh_external_evidence boolean not null default false,
  duration_ms integer not null check (duration_ms >= 0 and duration_ms <= 120000),
  tool_calls smallint not null default 0 check (tool_calls >= 0 and tool_calls <= 64),
  action_proposal_count smallint not null default 0 check (action_proposal_count >= 0 and action_proposal_count <= 64),
  response_characters integer not null default 0 check (response_characters >= 0),
  input_message_count smallint not null default 0 check (input_message_count >= 0 and input_message_count <= 64),
  injected_context_message_count smallint not null default 0 check (injected_context_message_count >= 0 and injected_context_message_count <= 16),
  model text not null,
  usage_available boolean not null default false,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  total_tokens integer check (total_tokens is null or total_tokens >= 0),
  cached_input_tokens integer check (cached_input_tokens is null or cached_input_tokens >= 0),
  created_at timestamptz not null default now()
);

create index intelligence_assistant_execution_metrics_created_idx
  on public.intelligence_assistant_execution_metrics (created_at desc);
create index intelligence_assistant_execution_metrics_mode_created_idx
  on public.intelligence_assistant_execution_metrics (mode, created_at desc);
create index intelligence_assistant_execution_metrics_user_created_idx
  on public.intelligence_assistant_execution_metrics (user_id, created_at desc);

alter table public.intelligence_assistant_execution_metrics enable row level security;
revoke all on table public.intelligence_assistant_execution_metrics from anon, authenticated;
grant select, insert, delete on table public.intelligence_assistant_execution_metrics to service_role;

create policy "assistant execution metrics service role"
  on public.intelligence_assistant_execution_metrics
  for all to service_role using (true) with check (true);