-- Migration applied to Supabase project "Chatbot Clique Mais"
-- Version: 20261002030338
-- Name: add_atomic_event_state_helpers_v01

create or replace function core.get_or_create_session(
  p_external_session_key text,
  p_channel text
)
returns core.sessions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session core.sessions;
begin
  if p_external_session_key is null or btrim(p_external_session_key) = '' then
    raise exception 'external_session_key_required';
  end if;
  if p_channel is null or btrim(p_channel) = '' then
    raise exception 'channel_required';
  end if;

  insert into core.sessions (external_session_key, channel)
  values (p_external_session_key, p_channel)
  on conflict (external_session_key) do nothing;

  select * into v_session
    from core.sessions
   where external_session_key = p_external_session_key;

  if v_session.channel <> p_channel then
    raise exception 'session_channel_mismatch';
  end if;

  return v_session;
end;
$$;

create or replace function core.record_event(
  p_session_id uuid,
  p_event_type text,
  p_direction text,
  p_source text,
  p_payload jsonb default '{}'::jsonb,
  p_correlation_id text default null,
  p_idempotency_key text default null,
  p_occurred_at timestamptz default now()
)
returns core.events
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event core.events;
begin
  if p_event_type is null or btrim(p_event_type) = '' then
    raise exception 'event_type_required';
  end if;
  if p_source is null or btrim(p_source) = '' then
    raise exception 'source_required';
  end if;
  if p_direction not in ('inbound','outbound','internal') then
    raise exception 'invalid_direction';
  end if;

  if p_idempotency_key is null then
    insert into core.events (
      session_id, event_type, direction, source, correlation_id,
      idempotency_key, payload, occurred_at
    )
    values (
      p_session_id, p_event_type, p_direction, p_source, p_correlation_id,
      null, coalesce(p_payload, '{}'::jsonb), coalesce(p_occurred_at, now())
    )
    returning * into v_event;
    return v_event;
  end if;

  insert into core.events (
    session_id, event_type, direction, source, correlation_id,
    idempotency_key, payload, occurred_at
  )
  values (
    p_session_id, p_event_type, p_direction, p_source, p_correlation_id,
    p_idempotency_key, coalesce(p_payload, '{}'::jsonb), coalesce(p_occurred_at, now())
  )
  on conflict (idempotency_key) do nothing
  returning * into v_event;

  if v_event.id is null then
    select * into v_event
      from core.events
     where idempotency_key = p_idempotency_key;

    if v_event.session_id <> p_session_id
       or v_event.event_type <> p_event_type
       or v_event.direction <> p_direction
       or v_event.source <> p_source then
      raise exception 'idempotency_key_collision';
    end if;
  end if;

  return v_event;
end;
$$;

create or replace function core.transition_session(
  p_session_id uuid,
  p_expected_version bigint,
  p_to_state text,
  p_trigger_event_id uuid default null,
  p_reason_code text default null,
  p_actor_type text default 'system',
  p_actor_name text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  session_id uuid,
  from_state text,
  to_state text,
  state_version bigint,
  transition_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_from_state text;
  v_current_version bigint;
  v_transition_id uuid;
begin
  if p_to_state is null or btrim(p_to_state) = '' then
    raise exception 'to_state_required';
  end if;

  select s.current_state, s.state_version
    into v_from_state, v_current_version
    from core.sessions s
   where s.id = p_session_id
   for update;

  if not found then
    raise exception 'session_not_found';
  end if;

  if v_current_version <> p_expected_version then
    raise exception 'state_version_conflict'
      using errcode = '40001',
            detail = format('expected=%s actual=%s', p_expected_version, v_current_version);
  end if;

  update core.sessions s
     set current_state = p_to_state,
         state_version = s.state_version + 1
   where s.id = p_session_id;

  insert into core.state_transitions (
    session_id, trigger_event_id, from_state, to_state,
    reason_code, actor_type, actor_name, metadata
  )
  values (
    p_session_id, p_trigger_event_id, v_from_state, p_to_state,
    p_reason_code, coalesce(nullif(p_actor_type,''),'system'), p_actor_name,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_transition_id;

  return query
  select p_session_id, v_from_state, p_to_state, v_current_version + 1, v_transition_id;
end;
$$;

revoke all on function core.get_or_create_session(text,text) from public, anon, authenticated;
revoke all on function core.record_event(uuid,text,text,text,jsonb,text,text,timestamptz) from public, anon, authenticated;
revoke all on function core.transition_session(uuid,bigint,text,uuid,text,text,text,jsonb) from public, anon, authenticated;

comment on function core.get_or_create_session(text,text)
is 'Idempotently creates or returns a runtime session by external key.';
comment on function core.record_event(uuid,text,text,text,jsonb,text,text,timestamptz)
is 'Records an event with optional idempotency-key deduplication and collision detection.';
comment on function core.transition_session(uuid,bigint,text,uuid,text,text,text,jsonb)
is 'Atomically transitions session state using optimistic version checking and audit history.';
