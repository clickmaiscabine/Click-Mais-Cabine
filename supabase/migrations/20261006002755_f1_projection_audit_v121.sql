-- Click Mais OS Fase 1 / F1.3
-- Canonical source: FASE_0_ESPECIFICACAO_EXECUTAVEL_v1.2.1
-- Scope: Trello projection schema + audit/observability extras + registry compatibility.

create table if not exists integrations.trello_projections (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete cascade,
  projection_type text not null
    check (projection_type in ('commercial','logistics')),
  board_id text not null,
  card_id text,
  list_id text,
  canonical_stage text,
  projection_version bigint not null default 0 check (projection_version >= 0),
  last_trello_action_id text,
  last_synced_at timestamptz,
  drift_status text not null default 'pending'
    check (drift_status in ('in_sync','drifted','pending','error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_event_id, projection_type)
);

create unique index if not exists trello_projection_board_card_uidx
  on integrations.trello_projections (board_id, card_id)
  where card_id is not null;

create index if not exists trello_projection_drift_idx
  on integrations.trello_projections (drift_status, last_synced_at);

alter table integrations.trello_projections enable row level security;
revoke all on integrations.trello_projections from public, anon, authenticated;
grant select, insert, update, delete on integrations.trello_projections to service_role;

drop trigger if exists trello_projections_touch_updated_at on integrations.trello_projections;
create trigger trello_projections_touch_updated_at
before update on integrations.trello_projections
for each row execute function core.touch_updated_at();

create table if not exists audit.decision_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references core.sessions(id) on delete set null,
  customer_event_id uuid references business.customer_events(id) on delete set null,
  input_event_id uuid references core.events(id) on delete set null,
  correlation_id text,
  purpose text not null,
  choice_set_version text not null,
  allowed_choices jsonb not null default '[]'::jsonb,
  selected_choice text,
  model_name text,
  input_hash text,
  output_hash text,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  status text not null default 'succeeded'
    check (status in ('queued','running','succeeded','failed','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists decision_runs_event_created_idx
  on audit.decision_runs (customer_event_id, created_at desc)
  where customer_event_id is not null;
create index if not exists decision_runs_correlation_idx
  on audit.decision_runs (correlation_id)
  where correlation_id is not null;

create table if not exists audit.guard_results (
  id uuid primary key default gen_random_uuid(),
  action_id text not null,
  customer_event_id uuid references business.customer_events(id) on delete set null,
  guard_name text not null,
  guard_version text not null,
  decision text not null check (decision in ('allow','deny','human')),
  reason_codes jsonb not null default '[]'::jsonb,
  actor_ref text,
  state_version bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists guard_results_action_idx
  on audit.guard_results (action_id, created_at desc);
create index if not exists guard_results_event_idx
  on audit.guard_results (customer_event_id, created_at desc)
  where customer_event_id is not null;

create table if not exists audit.shadow_evaluations (
  id uuid primary key default gen_random_uuid(),
  input_event_id uuid references core.events(id) on delete set null,
  customer_event_id uuid references business.customer_events(id) on delete set null,
  correlation_id text,
  candidate_action jsonb not null default '{}'::jsonb,
  candidate_response text,
  expected_ref jsonb,
  verdict text check (verdict is null or verdict in ('pass','fail','review','not_evaluated')),
  metrics jsonb not null default '{}'::jsonb,
  context_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shadow_evaluations_event_idx
  on audit.shadow_evaluations (customer_event_id, created_at desc)
  where customer_event_id is not null;
create index if not exists shadow_evaluations_input_idx
  on audit.shadow_evaluations (input_event_id)
  where input_event_id is not null;

create table if not exists audit.dead_letters (
  id uuid primary key default gen_random_uuid(),
  source_event_id uuid references core.events(id) on delete set null,
  customer_event_id uuid references business.customer_events(id) on delete set null,
  workflow_id text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  error_class text not null,
  payload_ref text,
  payload_hash text,
  status text not null default 'open'
    check (status in ('open','resolved','discarded')),
  next_human_action text,
  resolution text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dead_letters_open_idx
  on audit.dead_letters (status, created_at)
  where status='open';
create index if not exists dead_letters_event_idx
  on audit.dead_letters (source_event_id)
  where source_event_id is not null;

alter table audit.workflow_runs
  add column if not exists customer_event_id uuid references business.customer_events(id) on delete set null,
  add column if not exists correlation_id text,
  add column if not exists input_hash text,
  add column if not exists output_hash text,
  add column if not exists attempt integer not null default 1 check (attempt > 0),
  add column if not exists latency_ms integer check (latency_ms is null or latency_ms >= 0),
  add column if not exists error_class text;

create index if not exists workflow_runs_customer_event_idx
  on audit.workflow_runs (customer_event_id, started_at desc)
  where customer_event_id is not null;
create index if not exists workflow_runs_correlation_idx
  on audit.workflow_runs (correlation_id)
  where correlation_id is not null;

alter table audit.agent_runs
  add column if not exists customer_event_id uuid references business.customer_events(id) on delete set null,
  add column if not exists correlation_id text,
  add column if not exists prompt_version text,
  add column if not exists latency_ms integer check (latency_ms is null or latency_ms >= 0);

create index if not exists agent_runs_customer_event_idx
  on audit.agent_runs (customer_event_id, started_at desc)
  where customer_event_id is not null;
create index if not exists agent_runs_correlation_idx
  on audit.agent_runs (correlation_id)
  where correlation_id is not null;

alter table audit.decision_runs enable row level security;
alter table audit.guard_results enable row level security;
alter table audit.shadow_evaluations enable row level security;
alter table audit.dead_letters enable row level security;

revoke all on audit.decision_runs,
              audit.guard_results,
              audit.shadow_evaluations,
              audit.dead_letters
from public, anon, authenticated;

grant select, insert, update on audit.decision_runs,
                               audit.guard_results,
                               audit.shadow_evaluations,
                               audit.dead_letters
to service_role;

drop trigger if exists dead_letters_touch_updated_at on audit.dead_letters;
create trigger dead_letters_touch_updated_at
before update on audit.dead_letters
for each row execute function core.touch_updated_at();

alter table integrations.registry
  drop constraint if exists registry_status_check;
alter table integrations.registry
  add constraint registry_status_check
  check (status in (
    'active','standby','pending_credentials','planned',
    'disabled','deprecated','out_of_scope_v1'
  ));

update integrations.registry
set status='out_of_scope_v1',
    runtime_enabled=false,
    canonical=false,
    role='Out of scope V1; historical registry entry only',
    notes='Fase 0 v1.2.1: Chatwoot is OUT_OF_SCOPE_V1. Re-entry requires a new explicit human decision.',
    last_verified_at=now()
where platform_key='chatwoot';

comment on table integrations.trello_projections
is 'Human cockpit projection only. Supabase remains canonical; manual Trello movement is a requested command.';
comment on table audit.guard_results
is 'Guard authorization trail for side effects and state-changing actions.';
comment on table audit.shadow_evaluations
is 'Shadow-mode candidate/action evaluation with zero customer dispatch.';
comment on table audit.dead_letters
is 'Events that exhausted retry policy and require controlled resolution.';
