-- REVIEW: install in isolated DEV only. Not a production migration.
-- Existing tables/helpers only; no columns, lifecycle states or pricing authority added.
create or replace function business.get_quote_intake_context(p_message jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_session core.sessions;
  v_contact business.contacts;
  v_event business.customer_events;
  v_count integer;
  v_key text := 'meta:' || (p_message->>'phone_number_id') || ':' || (p_message->>'sender_id');
begin
  select * into v_session from core.sessions where external_session_key = v_key;
  select * into v_contact from business.contacts where whatsapp_id = p_message->>'sender_id';
  select count(*) into v_count from business.customer_events
    where contact_id = v_contact.id and status = 'active' and deleted_at is null;
  if v_session.active_customer_event_id is not null then
    select * into v_event from business.customer_events
      where id=v_session.active_customer_event_id and contact_id=v_contact.id and deleted_at is null;
  elsif v_count = 1 then
    select * into v_event from business.customer_events
      where contact_id = v_contact.id and status='active' and deleted_at is null;
  end if;
  return jsonb_build_object(
    'session',case when v_session.id is not null then to_jsonb(v_session) else null end,
    'contact',case when v_contact.id is not null then to_jsonb(v_contact) else null end,
    'customer_event',case when v_event.id is not null then to_jsonb(v_event) else null end,
    'identity_ambiguous',v_count > 1 and v_event.id is null,
    'duplicate',exists(select 1 from core.events where idempotency_key=p_message->>'idempotency_key'),
    'human_lock',exists(select 1 from business.human_handoffs where active and (customer_event_id=v_event.id or session_id=v_session.id)),
    'facts',coalesce((select jsonb_agg(to_jsonb(f)) from business.event_facts f where customer_event_id=v_event.id and is_current),'[]'::jsonb),
    'services',coalesce((select jsonb_agg(to_jsonb(s)) from business.event_services s where customer_event_id=v_event.id),'[]'::jsonb),
    'localities',coalesce((select jsonb_agg(jsonb_build_object('canonical_name',l.canonical_name,'aliases',
      coalesce((select jsonb_agg(a.alias) from catalog.locality_aliases a where a.locality_id=l.id and a.active),'[]'::jsonb)))
      from catalog.localities l where l.status <> 'disabled'),'[]'::jsonb)
  );
end;
$$;

create or replace function business.commit_quote_intake_plan(p_plan jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  m jsonb := p_plan->'message_context';
  v_session core.sessions;
  v_contact business.contacts;
  v_event business.customer_events;
  v_source core.events;
  v_fact business.event_facts;
  op jsonb;
  v_route text := p_plan->>'route';
  v_count integer;
  v_service text;
  v_services jsonb;
  v_key text := 'meta:' || (m->>'phone_number_id') || ':' || (m->>'sender_id');
begin
  if v_route = 'REJECT' then return jsonb_build_object('status','rejected','effects',jsonb_build_object('database_write',false)); end if;
  if m->>'sender_id' is null or m->>'phone_number_id' is null or m->>'idempotency_key' is null then raise exception 'invalid_message_context'; end if;
  -- One contact can have multiple channel sessions: serialize by contact, then lock session/event.
  perform pg_advisory_xact_lock(hashtextextended(m->>'sender_id', 0));
  v_session := core.get_or_create_session(v_key,'whatsapp');
  select * into v_session from core.sessions where id=v_session.id for update;
  select * into v_source from core.events where idempotency_key=m->>'idempotency_key';
  if v_source.id is not null then
    if v_source.session_id <> v_session.id or v_source.payload->'message_context'->>'text' is distinct from m->>'text' then raise exception 'idempotency_key_collision'; end if;
    return jsonb_build_object('status','duplicate','session_id',v_session.id,'effects',jsonb_build_object('database_write',false,'whatsapp_reply',false));
  end if;
  if v_session.state_version <> (p_plan->>'expected_version')::bigint then
    raise exception 'state_version_conflict' using errcode='40001';
  end if;
  select * into v_contact from business.contacts where whatsapp_id=m->>'sender_id' for update;
  if v_contact.id is null then
    insert into business.contacts(whatsapp_id) values(m->>'sender_id') returning * into v_contact;
  end if;
  if p_plan->>'customer_event_id' is not null then
    select * into v_event from business.customer_events where id=(p_plan->>'customer_event_id')::uuid and contact_id=v_contact.id for update;
    if v_event.id is null then raise exception 'event_contact_mismatch'; end if;
  else
    select count(*) into v_count from business.customer_events where contact_id=v_contact.id and status='active' and deleted_at is null;
    if v_count = 1 then
      select * into v_event from business.customer_events where contact_id=v_contact.id and status='active' and deleted_at is null for update;
    elsif v_count > 1 and v_route <> 'CLARIFY_EVENT' then raise exception 'event_context_changed' using errcode='40001';
    end if;
  end if;
  if v_contact.contact_category in ('personal','vendor','staff','venue','other') or v_contact.relationship_type in ('personal','vendor','staff','venue','other') then v_route := 'NONCOMMERCIAL';
  elsif v_session.status <> 'active' or exists(select 1 from business.human_handoffs where active and (session_id=v_session.id or customer_event_id=v_event.id)) then v_route := 'HUMAN_LOCK';
  elsif v_event.id is not null and (v_event.commercial_stage <> 'PRE_QUOTE' or v_event.status <> 'active' or v_event.deleted_at is not null) then v_route := 'EXISTING_LIFECYCLE'; end if;
  if v_event.id is null and v_route in ('ASK_MISSING_FIELD','CLARIFY_CONFLICT','QUOTE_CHECKS','COMBO_REQUIRES_HUMAN') then
    insert into business.customer_events(contact_id) values(v_contact.id) returning * into v_event;
  end if;
  if v_event.id is not null and coalesce((v_event.metadata->'quote_intake'->>'version')::bigint,0) <> coalesce((p_plan->>'expected_event_intake_version')::bigint,0) then
    raise exception 'event_intake_version_conflict' using errcode='40001';
  end if;
  -- core.record_event's existing signature cannot bind customer_event_id at insertion.
  -- Write once using the existing unique idempotency constraint; events remain append-only.
  insert into core.events(session_id,customer_event_id,event_type,direction,source,payload,idempotency_key,occurred_at)
  values(v_session.id,v_event.id,'message_received','inbound','meta_whatsapp',jsonb_build_object('message_context',m,'intake_route',v_route),m->>'idempotency_key',(m->>'occurred_at')::timestamptz)
  returning * into v_source;
  if v_route in ('ASK_MISSING_FIELD','CLARIFY_CONFLICT','QUOTE_CHECKS','COMBO_REQUIRES_HUMAN') then
    for op in select value from jsonb_array_elements(coalesce(p_plan->'operations','[]'::jsonb)) loop
      if op->>'action' <> 'RECORD_EVENT_FACT' or op->>'fact_key' not in ('service_interest','event_type','event_date','locality','venue_address','customer_name','relationship_to_event','acquisition_source') then raise exception 'unauthorized_operation'; end if;
      if op->>'source_type' <> 'customer' or op->>'fact_status' <> 'known' or nullif(op->'metadata'->>'evidence','') is null or position(op->'metadata'->>'evidence' in m->>'text')=0 then raise exception 'fact_evidence_missing'; end if;
      v_fact := business.record_event_fact(v_event.id,op->>'fact_key',op->'fact_value','known','customer',v_source.id,m->>'external_message_id',(op->>'confidence')::numeric,'whatsapp-intake',op->'metadata');
      case op->>'fact_key'
        when 'event_type' then update business.customer_events set event_type=op->>'fact_value' where id=v_event.id;
        when 'event_date' then update business.customer_events set event_date=(op->>'fact_value')::date where id=v_event.id;
        when 'locality' then update business.customer_events set city=op->>'fact_value' where id=v_event.id;
        when 'venue_address' then update business.customer_events set venue_address=op->>'fact_value' where id=v_event.id;
        when 'customer_name' then update business.contacts set display_name=op->>'fact_value' where id=v_contact.id;
        when 'relationship_to_event' then update business.customer_events set metadata=jsonb_set(metadata,'{relationship_to_event}',op->'fact_value') where id=v_event.id;
        when 'service_interest' then
          v_services := op->'fact_value';
          update business.event_services set status='cancelled' where customer_event_id=v_event.id and status='interested' and not (v_services ? service_code);
          for v_service in select jsonb_array_elements_text(v_services) loop
            if not exists(select 1 from catalog.services where code=v_service and active) then raise exception 'service_not_in_catalog'; end if;
            insert into business.event_services(customer_event_id,service_code,service_id,status)
              select v_event.id,v_service,id,'interested' from catalog.services where code=v_service
              on conflict(customer_event_id,service_code) do update set status='interested';
          end loop;
        else null;
      end case;
    end loop;
    update business.customer_events set metadata=jsonb_set(metadata,'{quote_intake}',jsonb_build_object('conflicts',coalesce(p_plan->'conflicts','{}'::jsonb),'version',coalesce((metadata->'quote_intake'->>'version')::bigint,0)+1)) where id=v_event.id;
  end if;
  update core.sessions set contact_id=v_contact.id, active_customer_event_id=coalesce(v_event.id,active_customer_event_id) where id=v_session.id;
  perform core.transition_session(v_session.id,v_session.state_version,v_session.current_state,v_source.id,'QUOTE_INTAKE_UPDATED','system','whatsapp-intake');
  update core.sessions set context=jsonb_set(context,'{quote_intake}',jsonb_build_object('last_action_key',case when v_route=p_plan->>'route' then p_plan->>'action_key' else null end,'last_message_id',m->>'external_message_id')) where id=v_session.id;
  return jsonb_build_object('status','committed','route',v_route,'session_id',v_session.id,'customer_event_id',v_event.id,'source_event_id',v_source.id,
    'state_version',v_session.state_version+1,'proposed_response',case when v_route=p_plan->>'route' then p_plan->'proposed_response' else null end,
    'ready_for_quote_checks',v_route='QUOTE_CHECKS','effects',jsonb_build_object('database_write',true,'whatsapp_reply',false,'quote_calculation',false));
end;
$$;
revoke all on function business.get_quote_intake_context(jsonb) from public,anon,authenticated;
revoke all on function business.commit_quote_intake_plan(jsonb) from public,anon,authenticated;
grant execute on function business.get_quote_intake_context(jsonb) to service_role;
grant execute on function business.commit_quote_intake_plan(jsonb) to service_role;
