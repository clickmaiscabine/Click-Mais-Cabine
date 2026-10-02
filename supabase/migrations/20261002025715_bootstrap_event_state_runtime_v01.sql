-- Migration applied to Supabase project "Chatbot Clique Mais"
-- Version: 20261002025715
-- Name: bootstrap_event_state_runtime_v01

create schema if not exists core;
create schema if not exists audit;

revoke all on schema core from public, anon, authenticated;
revoke all on schema audit from public, anon, authenticated;

create table core.sessions (
  id uuid primary key default gen_random_uuid(),
  external_session_key text not null unique,
  channel text not null,
  current_state text not null default 'new',
  state_version bigint not null default 0 check (state_version >= 0),
  status text not null default 'active'
    check (status in ('active', 'paused', 'closed')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table core.events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references core.sessions(id) on delete cascade,
  event_type text not null,
  direction text not null default 'internal'
    check (direction in ('inbound', 'outbound', 'internal')),
  source text not null,
  correlation_id text,
  idempotency_key text unique,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table core.state_transitions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references core.sessions(id) on delete cascade,
  trigger_event_id uuid references core.events(id) on delete set null,
  from_state text,
  to_state text not null,
  reason_code text,
  actor_type text not null default 'system',
  actor_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table audit.agent_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references core.sessions(id) on delete set null,
  agent_name text not null,
  model_name text,
  purpose text not null,
  artifact_path text,
  status text not null
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  input_hash text,
  output_hash text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table audit.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references core.sessions(id) on delete set null,
  input_event_id uuid references core.events(id) on delete set null,
  workflow_id text not null,
  workflow_version text,
  n8n_execution_id text,
  status text not null
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index events_session_created_idx
  on core.events (session_id, created_at desc);

create index events_correlation_idx
  on core.events (correlation_id)
  where correlation_id is not null;

create index transitions_session_created_idx
  on core.state_transitions (session_id, created_at desc);

create index agent_runs_session_started_idx
  on audit.agent_runs (session_id, started_at desc);

create index workflow_runs_session_started_idx
  on audit.workflow_runs (session_id, started_at desc);

create index workflow_runs_execution_idx
  on audit.workflow_runs (n8n_execution_id)
  where n8n_execution_id is not null;

create or replace function core.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function core.touch_updated_at() from public;

create trigger sessions_touch_updated_at
before update on core.sessions
for each row
execute function core.touch_updated_at();

comment on schema core is 'Operational runtime state for Click Mais Cabine.';
comment on schema audit is 'Operational audit trail for agents and workflows.';
comment on table core.sessions is 'Canonical runtime session and current state.';
comment on table core.events is 'Immutable-like event stream inputs/outputs/internal events.';
comment on table core.state_transitions is 'Explicit history of state transitions.';
comment on table audit.agent_runs is 'Audit records for AI/agent executions.';
comment on table audit.workflow_runs is 'Audit records for n8n workflow executions.';
