-- Applied to Supabase project "Chatbot Clique Mais"
-- Version: 20261003051005
-- Name: add_business_stage_history_and_backend_grants_v1

create table business.event_stage_transitions (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete cascade,
  trigger_event_id uuid references core.events(id) on delete set null,
  from_stage text,
  to_stage text not null,
  reason_code text,
  actor_type text not null default 'system',
  actor_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index event_stage_transitions_event_created_idx
  on business.event_stage_transitions (customer_event_id, created_at desc);
create index event_stage_transitions_trigger_event_idx
  on business.event_stage_transitions (trigger_event_id)
  where trigger_event_id is not null;

alter table business.event_stage_transitions enable row level security;
revoke all on business.event_stage_transitions from public, anon, authenticated;
grant select, insert, update, delete on business.event_stage_transitions to service_role;

drop function if exists business.transition_customer_event(uuid,bigint,text,text,text,text,uuid,jsonb);

create function business.transition_customer_event(
  p_customer_event_id uuid,
  p_expected_version bigint,
  p_to_stage text,
  p_actor_type text default 'system',
  p_actor_ref text default null,
  p_reason_code text default null,
  p_trigger_event_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  customer_event_id uuid,
  from_stage text,
  to_stage text,
  stage_version bigint,
  transition_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_from_stage text;
  v_current_version bigint;
  v_transition_id uuid;
begin
  select e.lifecycle_stage, e.stage_version
    into v_from_stage, v_current_version
    from business.customer_events e
   where e.id = p_customer_event_id
   for update;

  if not found then
    raise exception 'customer_event_not_found';
  end if;

  if v_current_version <> p_expected_version then
    raise exception 'event_stage_version_conflict'
      using errcode = '40001',
            detail = format('expected=%s actual=%s', p_expected_version, v_current_version);
  end if;

  update business.customer_events
     set lifecycle_stage = p_to_stage,
         stage_version = stage_version + 1
   where id = p_customer_event_id;

  insert into business.event_stage_transitions (
    customer_event_id, trigger_event_id, from_stage, to_stage,
    reason_code, actor_type, actor_ref, metadata
  )
  values (
    p_customer_event_id, p_trigger_event_id, v_from_stage, p_to_stage,
    p_reason_code, coalesce(nullif(p_actor_type,''),'system'), p_actor_ref,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_transition_id;

  insert into core.events (
    session_id, customer_event_id, event_type, direction, source,
    correlation_id, idempotency_key, payload, occurred_at
  )
  select
    s.id,
    p_customer_event_id,
    'business.lifecycle_transition',
    'internal',
    'business.transition_customer_event',
    null,
    null,
    jsonb_build_object(
      'transition_id', v_transition_id,
      'from_stage', v_from_stage,
      'to_stage', p_to_stage,
      'actor_type', coalesce(nullif(p_actor_type,''),'system'),
      'actor_ref', p_actor_ref,
      'reason_code', p_reason_code,
      'trigger_event_id', p_trigger_event_id,
      'metadata', coalesce(p_metadata, '{}'::jsonb)
    ),
    now()
  from core.sessions s
  where s.active_customer_event_id = p_customer_event_id
  order by s.updated_at desc
  limit 1;

  return query
  select p_customer_event_id, v_from_stage, p_to_stage, v_current_version + 1, v_transition_id;
end;
$$;

revoke execute on function business.transition_customer_event(uuid,bigint,text,text,text,text,uuid,jsonb)
from public, anon, authenticated;
grant execute on function business.transition_customer_event(uuid,bigint,text,text,text,text,uuid,jsonb)
to service_role;

drop trigger if exists module_states_touch_updated_at on business.module_states;
create trigger module_states_touch_updated_at
before update on business.module_states
for each row execute function core.touch_updated_at();

grant usage on schema core to service_role;
grant usage on schema audit to service_role;

grant select, insert, update on core.sessions to service_role;
grant select, insert on core.events to service_role;
grant select, insert on core.state_transitions to service_role;

grant select, insert, update on audit.agent_runs to service_role;
grant select, insert, update on audit.workflow_runs to service_role;

grant execute on function core.get_or_create_session(text,text) to service_role;
grant execute on function core.record_event(uuid,text,text,text,jsonb,text,text,timestamptz) to service_role;
grant execute on function core.transition_session(uuid,bigint,text,uuid,text,text,text,jsonb) to service_role;

comment on table business.event_stage_transitions
is 'Explicit lifecycle history for a customer event, independent from the transient chat session state.';
