-- Click Mais OS F1 v1.2.1 acceptance suite
-- Runs inside a transaction and rolls back all fixture data.
begin;

do $$
declare
  v_contact uuid;
  v_event uuid;
  v_event2 uuid;
  v_session uuid;
  v_core_event_1 uuid;
  v_core_event_2 uuid;
  v_count integer;
  v_stage text;
  v_version bigint;
begin
  select count(*) into v_count
  from information_schema.tables
  where table_schema||'.'||table_name in (
    'catalog.services','catalog.pricing_tiers','catalog.localities',
    'catalog.locality_aliases','catalog.commercial_rules',
    'business.contact_identities','business.acquisition_touchpoints',
    'business.quote_items','business.reservations','business.campaign_members',
    'business.human_tasks','integrations.trello_projections',
    'audit.decision_runs','audit.guard_results',
    'audit.shadow_evaluations','audit.dead_letters'
  );
  if v_count <> 16 then
    raise exception 'F1_SCHEMA_TABLE_COUNT_FAIL expected=16 actual=%', v_count;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema='business' and table_name in ('lead','leads')
  ) then raise exception 'LEAD_ENTITY_FORBIDDEN'; end if;

  if (select count(*) from catalog.pricing_tiers) <> 8 then raise exception 'PRICING_TIER_COUNT_FAIL'; end if;
  if (select count(*) from catalog.localities) <> 234 then raise exception 'LOCALITY_COUNT_FAIL'; end if;
  if (select count(*) from catalog.services) <> 8 then raise exception 'SERVICE_COUNT_FAIL'; end if;

  if not exists (
    select 1
    from catalog.localities l
    join catalog.pricing_tiers p on p.id=l.pricing_tier_id
    where l.normalized_name='mogi das cruzes'
      and p.code='T1190' and p.pix_base=1190.00 and l.status='active'
  ) then raise exception 'MOGI_CANONICAL_PRICE_FAIL'; end if;

  if not exists (
    select 1 from catalog.localities
    where normalized_name='raposo tavares'
      and status='human_required' and pricing_tier_id is null
  ) then raise exception 'RAPOSO_HANDOFF_FAIL'; end if;

  if has_table_privilege('anon','catalog.pricing_tiers','select')
     or has_table_privilege('authenticated','catalog.pricing_tiers','select') then
    raise exception 'INTERNAL_TIER_EXPOSED';
  end if;

  -- AT-017
  insert into business.contacts(display_name,contact_category)
  values ('F1 TEST CONTACT','commercial_external')
  returning id into v_contact;

  insert into business.contact_identities
    (contact_id,identity_type,identity_value,normalized_value,verified,is_primary)
  values (v_contact,'phone_e164','+5511999990001','+5511999990001',true,true);

  insert into business.customer_events(contact_id,event_type,event_date)
  values (v_contact,'aniversario',date '2027-01-10')
  returning id into v_event;

  insert into business.customer_events(contact_id,event_type,event_date)
  values (v_contact,'casamento',date '2027-03-20')
  returning id into v_event2;

  select count(*) into v_count from business.customer_events where contact_id=v_contact;
  if v_count <> 2 then raise exception 'AT017_MULTI_EVENT_FAIL'; end if;

  -- EventFact append-only
  perform business.record_event_fact(
    v_event,'event_date',to_jsonb('2027-01-10'::text),
    'known','customer',null,'test:1',1.0,'acceptance','{}'::jsonb
  );
  perform business.record_event_fact(
    v_event,'event_date',to_jsonb('2027-01-17'::text),
    'known','customer',null,'test:2',1.0,'acceptance','{}'::jsonb
  );

  if (select count(*) from business.event_facts
      where customer_event_id=v_event and fact_key='event_date') <> 2
  then raise exception 'FACT_HISTORY_COUNT_FAIL'; end if;

  if (select count(*) from business.event_facts
      where customer_event_id=v_event and fact_key='event_date' and is_current) <> 1
  then raise exception 'FACT_CURRENT_UNIQUENESS_FAIL'; end if;

  if exists (
    select 1 from business.event_facts
    where customer_event_id=v_event and fact_key='event_date'
      and not is_current and valid_to is null
  ) then raise exception 'FACT_VALID_TO_FAIL'; end if;

  -- AT-038
  perform 1 from business.transition_customer_event(
    v_event,0,'ORCAMENTO','system','acceptance','quote_sent',null,'{}'::jsonb
  );

  select commercial_stage,stage_version into v_stage,v_version
  from business.customer_events where id=v_event;
  if v_stage <> 'ORCAMENTO' or v_version <> 1 then
    raise exception 'STAGE_TRANSITION_FAIL stage=% version=%',v_stage,v_version;
  end if;

  begin
    perform 1 from business.transition_customer_event(
      v_event,0,'RESPOSTA','system','acceptance','stale_write',null,'{}'::jsonb
    );
    raise exception 'EXPECTED_STATE_VERSION_CONFLICT_NOT_RAISED';
  exception when sqlstate '40001' then null;
  end;

  if (select count(*) from business.event_stage_transitions where customer_event_id=v_event) <> 1
  then raise exception 'TRANSITION_HISTORY_FAIL'; end if;

  -- AT-021
  insert into core.sessions(external_session_key,channel,contact_id,active_customer_event_id)
  values ('f1:test:session','test',v_contact,v_event)
  returning id into v_session;

  select id into v_core_event_1
  from core.record_event(v_session,'message_received','inbound','acceptance',
                         '{"text":"hello"}'::jsonb,'corr-f1','meta:test:wamid-1',now());
  select id into v_core_event_2
  from core.record_event(v_session,'message_received','inbound','acceptance',
                         '{"text":"hello"}'::jsonb,'corr-f1','meta:test:wamid-1',now());
  if v_core_event_1 <> v_core_event_2 then raise exception 'AT021_IDEMPOTENCY_FAIL'; end if;

  -- AT-023
  insert into business.human_handoffs(customer_event_id,session_id,reason_code,source)
  values (v_event,v_session,'acceptance_lock','system');

  perform 1 from core.record_event(v_session,'message_received','inbound','acceptance',
                                   '{"text":"locked but ingested"}'::jsonb,
                                   'corr-f1-lock','meta:test:wamid-2',now());
  if not exists (
    select 1 from core.events
    where session_id=v_session and idempotency_key='meta:test:wamid-2'
  ) then raise exception 'AT023_INGEST_DURING_LOCK_FAIL'; end if;

  -- AT-039
  insert into business.quotes(
    customer_event_id,quote_version,status,pricing_source,
    rule_set_version,fingerprint,total_pix,total_card
  ) values (v_event,1,'ready','acceptance','2026-10-05','fp-f1',1190,1410);

  begin
    insert into business.quotes(
      customer_event_id,quote_version,status,pricing_source,
      rule_set_version,fingerprint,total_pix,total_card
    ) values (v_event,2,'ready','acceptance','2026-10-05','fp-f1',1190,1410);
    raise exception 'AT039_DUPLICATE_FINGERPRINT_NOT_BLOCKED';
  exception when unique_violation then null;
  end;

  -- AT-040 structural uniqueness
  insert into business.reservations(customer_event_id,status,availability_status,source)
  values (v_event,'confirmed','available','acceptance');
  begin
    insert into business.reservations(customer_event_id,status,availability_status,source)
    values (v_event,'confirmed','available','acceptance');
    raise exception 'AT040_DUPLICATE_RESERVATION_NOT_BLOCKED';
  exception when unique_violation then null;
  end;

  insert into integrations.trello_projections(
    customer_event_id,projection_type,board_id,card_id,canonical_stage
  ) values (v_event,'logistics','test-board','test-card','GANHO');
  begin
    insert into integrations.trello_projections(
      customer_event_id,projection_type,board_id,card_id,canonical_stage
    ) values (v_event,'logistics','test-board-2','test-card-2','GANHO');
    raise exception 'AT040_DUPLICATE_LOGISTICS_PROJECTION_NOT_BLOCKED';
  exception when unique_violation then null;
  end;

  -- AT-025
  perform 1 from business.transition_customer_event(
    v_event,1,'PERDIDO','human','acceptance','explicit_loss',null,'{}'::jsonb
  );
  if (select count(*) from business.event_facts where customer_event_id=v_event) <> 2
     or (select count(*) from business.quotes where customer_event_id=v_event) <> 1
  then raise exception 'AT025_HISTORY_PRESERVATION_FAIL'; end if;
end $$;

rollback;

select jsonb_build_object(
  'status','PASS',
  'suite','F1_SCHEMA_V121',
  'side_effects_persisted',false
) as result;
