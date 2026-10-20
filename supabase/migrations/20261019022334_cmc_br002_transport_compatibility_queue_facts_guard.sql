CREATE OR REPLACE FUNCTION public.cm_quote_flow1_apply_v1(p_sender_id text, p_external_message_id text, p_extracted jsonb DEFAULT '{}'::jsonb, p_evidence jsonb DEFAULT '{}'::jsonb, p_message_text text DEFAULT NULL::text, p_category text DEFAULT 'commercial'::text, p_occurred_at timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_contact uuid;
  v_session core.sessions%rowtype;
  v_event business.customer_events%rowtype;
  v_inbound uuid;
  v_facts jsonb;
  v_pending jsonb;
  v_context jsonb;
  v_key text;
  v_val jsonb;
  v_old jsonb;
  v_waiting jsonb;
  v_changed boolean;
  v_service text;
  v_next text;
  v_missing text[] := ARRAY[]::text[];
  v_human_locked boolean := false;
  v_result jsonb;
  v_corporate boolean;
  v_changed_keys text[] := ARRAY[]::text[];
BEGIN
  IF p_sender_id IS NULL OR p_sender_id !~ '^[0-9]{8,20}$' THEN
    RAISE EXCEPTION 'invalid_whatsapp_sender';
  END IF;
  IF p_external_message_id IS NULL OR length(p_external_message_id) NOT BETWEEN 5 AND 255 THEN
    RAISE EXCEPTION 'invalid_external_message_id';
  END IF;
  IF p_extracted IS NULL OR jsonb_typeof(p_extracted) <> 'object' OR
     p_evidence IS NULL OR jsonb_typeof(p_evidence) <> 'object' THEN
    RAISE EXCEPTION 'invalid_json_payload';
  END IF;
  -- Non-commercial and operational messages must be routed before changing
  -- a quote record; this function never sends messages.
  IF p_category <> 'commercial' THEN
    RETURN jsonb_build_object('accepted', false, 'next_flow',
      CASE WHEN p_category = 'operational' THEN 'ROUTE_OPERATIONS' ELSE 'ROUTE_HUMAN' END);
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('cm-quote:' || p_sender_id, 0));

  INSERT INTO business.contacts (whatsapp_id, contact_category)
  VALUES (p_sender_id, 'commercial_external')
  ON CONFLICT (whatsapp_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_contact;

  INSERT INTO core.sessions (external_session_key, channel, contact_id)
  VALUES ('whatsapp:' || p_sender_id, 'whatsapp', v_contact)
  ON CONFLICT (external_session_key) DO UPDATE
     SET contact_id = EXCLUDED.contact_id
  RETURNING * INTO v_session;

  IF v_session.active_customer_event_id IS NOT NULL THEN
    SELECT * INTO v_event FROM business.customer_events
    WHERE id = v_session.active_customer_event_id FOR UPDATE;
  END IF;

  IF v_event.id IS NOT NULL AND
     (v_event.status <> 'active' OR (v_event.commercial_stage <> 'PRE_QUOTE' AND NOT(p_sender_id='5511956390586' AND v_event.event_type='empresarial' AND v_event.commercial_stage='ORCAMENTO'))
      OR v_event.operational_stage <> 'NOT_STARTED') THEN
    RETURN jsonb_build_object('accepted', false, 'contact_id', v_contact,
      'session_id', v_session.id, 'customer_event_id', v_event.id,
      'next_flow', 'ROUTE_OPERATIONS', 'reason', 'existing_event_not_pre_quote');
  END IF;

  IF v_event.id IS NULL THEN
    INSERT INTO business.customer_events (contact_id, status, lifecycle_stage, commercial_stage, operational_stage)
    VALUES (v_contact, 'active', 'lead_qualifying', 'PRE_QUOTE', 'NOT_STARTED')
    RETURNING * INTO v_event;
    UPDATE core.sessions SET active_customer_event_id = v_event.id WHERE id = v_session.id;
  END IF;

  INSERT INTO core.events
    (session_id, customer_event_id, event_type, direction, source, idempotency_key, payload, occurred_at)
  VALUES
    (v_session.id, v_event.id, 'message_received', 'inbound', CASE WHEN p_sender_id='5511956390586' AND coalesce(p_evidence->>'_transport','') = 'lab_replay' THEN 'lab_replay' ELSE 'meta_whatsapp' END,
     (CASE WHEN p_sender_id='5511956390586' AND coalesce(p_evidence->>'_transport','')='lab_replay' THEN 'lab:' ELSE 'meta:' END) || p_external_message_id, jsonb_build_object(
       'text', coalesce(p_message_text, ''), 'extracted', p_extracted,
       'evidence', p_evidence, 'scope', 'flow1'), coalesce(p_occurred_at, now()))
  ON CONFLICT (idempotency_key) DO NOTHING RETURNING id INTO v_inbound;

  IF v_inbound IS NULL THEN
    RETURN jsonb_build_object('accepted', true, 'duplicate', true,
      'session_id', v_session.id, 'customer_event_id', v_event.id,
      'context', v_session.context, 'next_flow', 'DUPLICATE_NOOP',
      'ready_for_quote_checks', false);
  END IF;

  v_context := coalesce(v_session.context, '{}'::jsonb);
  v_facts := CASE WHEN jsonb_typeof(v_context->'facts') = 'object' THEN v_context->'facts'
                  ELSE '{}'::jsonb END;
  v_pending := CASE WHEN jsonb_typeof(v_context->'pending_conflicts') = 'object'
                     THEN v_context->'pending_conflicts' ELSE '{}'::jsonb END;

  v_corporate := p_sender_id='5511956390586' AND coalesce(p_extracted->>'purpose',v_facts->>'purpose')='empresarial';

  -- Only agreed fields are admitted. Any proposed replacement becomes a
  -- pending conflict until a subsequent message explicitly confirms a value.
  FOR v_key, v_val IN SELECT key, value FROM jsonb_each(p_extracted) LOOP
    IF v_key NOT IN ('services','purpose','event_date','event_date_partial','city',
                     'district','venue_name','venue_address','contact_name',
                     'relationship_to_event','acquisition_source','dias_evento','periodos_por_dia',
                     'event_dates','data_inicio','data_fim','purpose_ambiguous','locality_ambiguous') THEN
      RAISE EXCEPTION 'unsupported_quote_fact: %', v_key;
    END IF;
    IF v_val IS NULL OR v_val = 'null'::jsonb OR v_val = '""'::jsonb OR v_val = '[]'::jsonb THEN
      CONTINUE;
    END IF;
    IF v_key IN ('dias_evento','periodos_por_dia','event_dates','data_inicio','data_fim','purpose_ambiguous','locality_ambiguous') AND NOT v_corporate THEN
      RAISE EXCEPTION 'corporate_facts_only_meta_test';
    END IF;
    IF v_key = 'services' THEN
      IF jsonb_typeof(v_val) <> 'array' OR jsonb_array_length(v_val) = 0 THEN
        RAISE EXCEPTION 'invalid_service_list';
      END IF;
      FOR v_service IN SELECT jsonb_array_elements_text(v_val) LOOP
        IF v_service NOT IN ('cabine_fotos','totem_fotos','plataforma_360',
                             'set_fotografico','fotografo') THEN
          RAISE EXCEPTION 'invalid_service_code';
        END IF;
      END LOOP;
    ELSIF v_key IN ('dias_evento','periodos_por_dia') THEN
      IF jsonb_typeof(v_val)<>'number' OR (v_val #>> '{}')::numeric <= 0 OR (v_val #>> '{}')::numeric > 9007199254740991 THEN RAISE EXCEPTION 'invalid_corporate_number'; END IF;
      IF v_key='dias_evento' AND trunc((v_val #>> '{}')::numeric) <> (v_val #>> '{}')::numeric THEN RAISE EXCEPTION 'invalid_corporate_days'; END IF;
    ELSIF v_key='event_dates' THEN
      IF jsonb_typeof(v_val)<>'array' THEN RAISE EXCEPTION 'invalid_corporate_dates'; END IF;
      FOR v_service IN SELECT jsonb_array_elements_text(v_val) LOOP
        IF v_service !~ '^20[2-9][0-9]-[0-1][0-9]-[0-3][0-9]$' THEN RAISE EXCEPTION 'invalid_corporate_date'; END IF;
        PERFORM v_service::date;
      END LOOP;
    ELSIF jsonb_typeof(v_val) <> 'string' THEN
      RAISE EXCEPTION 'invalid_fact_type: %', v_key;
    END IF;
    IF v_key IN ('event_date','data_inicio','data_fim') THEN
      IF (v_val #>> '{}') !~ '^20[2-9][0-9]-[0-1][0-9]-[0-3][0-9]$' THEN
        RAISE EXCEPTION 'invalid_event_date';
      END IF;
      PERFORM (v_val #>> '{}')::date; -- reject impossible calendar values
    END IF;

    v_old := v_facts -> v_key;
    v_waiting := v_pending -> v_key;
    v_changed := false;

    IF v_waiting IS NOT NULL THEN
      IF v_val = (v_waiting->'incoming') OR v_val = (v_waiting->'existing') THEN
        v_pending := v_pending - v_key;
        IF v_val IS DISTINCT FROM v_old THEN
          v_changed := true;
        END IF;
      ELSE
        v_pending := jsonb_set(v_pending, ARRAY[v_key],
                        jsonb_build_object('existing', v_old, 'incoming', v_val), true);
      END IF;
    ELSIF v_corporate AND v_key='event_dates' AND v_old IS NOT NULL AND jsonb_array_length(v_old) < coalesce((p_extracted->>'dias_evento')::int,(v_facts->>'dias_evento')::int,0) AND v_val @> v_old THEN
      v_changed := true;
    ELSIF v_corporate AND v_key IN ('data_inicio','data_fim','event_date') AND p_extracted ? 'event_dates' AND coalesce(jsonb_array_length(v_facts->'event_dates'),0) < coalesce((p_extracted->>'dias_evento')::int,(v_facts->>'dias_evento')::int,0) THEN
      v_changed := true;
    ELSIF v_old IS NOT NULL AND v_val IS DISTINCT FROM v_old THEN
      v_pending := jsonb_set(v_pending, ARRAY[v_key],
                      jsonb_build_object('existing', v_old, 'incoming', v_val), true);
    ELSIF v_old IS NULL THEN
      v_changed := true;
    END IF;

    IF NOT v_changed THEN CONTINUE; END IF;

    v_facts := jsonb_set(v_facts, ARRAY[v_key], v_val, true);
    v_changed_keys := array_append(v_changed_keys,v_key);
    IF v_key = 'purpose' THEN
      UPDATE business.customer_events SET event_type = v_val #>> '{}', updated_at = now()
      WHERE id = v_event.id;
    ELSIF v_key = 'event_date' THEN
      UPDATE business.customer_events SET event_date = (v_val #>> '{}')::date, updated_at = now()
      WHERE id = v_event.id;
    ELSIF v_key = 'city' THEN
      UPDATE business.customer_events SET city = v_val #>> '{}', updated_at = now()
      WHERE id = v_event.id;
    ELSIF v_key = 'district' THEN
      UPDATE business.customer_events SET district = v_val #>> '{}', updated_at = now()
      WHERE id = v_event.id;
    ELSIF v_key = 'venue_name' THEN
      UPDATE business.customer_events SET venue_name = v_val #>> '{}', updated_at = now()
      WHERE id = v_event.id;
    ELSIF v_key = 'venue_address' THEN
      UPDATE business.customer_events SET venue_address = v_val #>> '{}', updated_at = now()
      WHERE id = v_event.id;
    ELSIF v_key = 'contact_name' THEN
      UPDATE business.contacts SET display_name = v_val #>> '{}', updated_at = now()
      WHERE id = v_contact;
    ELSIF v_key = 'services' THEN
      UPDATE business.event_services SET status = 'cancelled'
      WHERE customer_event_id = v_event.id AND status = 'interested';
      FOR v_service IN SELECT jsonb_array_elements_text(v_val) LOOP
        INSERT INTO business.event_services(customer_event_id, service_code, status)
        VALUES (v_event.id, v_service, 'interested')
        ON CONFLICT (customer_event_id,service_code) DO UPDATE
          SET status = 'interested', updated_at = now();
      END LOOP;
    END IF;
    PERFORM business.record_event_fact(v_event.id, v_key, v_val,
      'known', 'customer', v_inbound, p_external_message_id, NULL, NULL,
      jsonb_build_object('evidence', coalesce(p_evidence->v_key, 'null'::jsonb)));
  END LOOP;

  IF v_corporate THEN
    IF NOT (v_facts ? 'services') THEN v_missing:=array_append(v_missing,'service'); END IF;
    IF NOT (v_facts ? 'purpose') THEN v_missing:=array_append(v_missing,'purpose'); END IF;
    IF NOT (v_facts ? 'dias_evento') THEN v_missing:=array_append(v_missing,'corporate_days'); END IF;
    IF NOT (v_facts ? 'periodos_por_dia') THEN v_missing:=array_append(v_missing,'corporate_periods'); END IF;
    IF NOT (v_facts ? 'event_dates') OR jsonb_array_length(v_facts->'event_dates') IS DISTINCT FROM (v_facts->>'dias_evento')::int OR (SELECT count(DISTINCT d) FROM jsonb_array_elements_text(coalesce(v_facts->'event_dates','[]'::jsonb)) d) IS DISTINCT FROM (v_facts->>'dias_evento')::int THEN v_missing:=array_append(v_missing,'corporate_dates'); END IF;
    IF NOT (v_facts ? 'city') OR v_facts->>'locality_ambiguous'='true' OR (v_facts->>'city'='sao paulo' AND NOT(v_facts ? 'district')) THEN v_missing:=array_append(v_missing,'event_location'); END IF;
  ELSE
  IF NOT (v_facts ? 'services') THEN v_missing := array_append(v_missing,'service'); END IF;
  IF NOT (v_facts ? 'purpose') THEN v_missing := array_append(v_missing,'purpose'); END IF;
  IF NOT (v_facts ? 'event_date') THEN v_missing := array_append(v_missing,'event_date'); END IF;
  IF NOT (v_facts ? 'city') OR
     (v_facts->>'city' = 'sao paulo' AND NOT (v_facts ? 'district')) THEN
    v_missing := array_append(v_missing,'event_location');
  END IF;

  END IF;

  SELECT EXISTS(SELECT 1 FROM business.human_handoffs
    WHERE active AND (session_id = v_session.id OR customer_event_id = v_event.id))
    INTO v_human_locked;

  IF v_human_locked THEN v_next := 'HUMAN_LOCK_NO_REPLY';
  ELSIF v_pending <> '{}'::jsonb THEN v_next := 'CLARIFY_CONFLICT';
  ELSIF v_corporate AND ((v_facts->>'periodos_por_dia')::numeric NOT IN (1,2,3) OR jsonb_array_length(coalesce(v_facts->'services','[]'::jsonb))>1 OR v_facts->>'purpose_ambiguous'='true') THEN v_next := 'ROUTE_HUMAN';
  ELSIF array_length(v_missing,1) IS NULL THEN v_next := 'FLOW_5_READY';
  ELSIF v_missing[1] = 'service' THEN v_next := 'FLOW_1_SERVICE';
  ELSIF v_missing[1] = 'purpose' THEN v_next := 'FLOW_2_PURPOSE';
  ELSIF v_missing[1] = 'event_date' THEN v_next := 'FLOW_3_DATE';
  ELSIF v_missing[1]='corporate_days' THEN v_next:='FLOW_CORPORATE_DAYS';
  ELSIF v_missing[1]='corporate_periods' THEN v_next:='FLOW_CORPORATE_PERIODS';
  ELSIF v_missing[1]='corporate_dates' THEN v_next:='CLARIFY_CORPORATE_DATES';
  ELSE v_next := 'FLOW_4_LOCALITY';
  END IF;

  v_context := v_context || jsonb_build_object(
    'facts',v_facts,'pending_conflicts',v_pending,
    'last_message_id',p_external_message_id,
    'last_flow',v_next,
    'missing_required',to_jsonb(v_missing),
    'pending_question',CASE v_next
      WHEN 'FLOW_1_SERVICE' THEN 'service'
      WHEN 'FLOW_2_PURPOSE' THEN 'purpose'
      WHEN 'FLOW_3_DATE' THEN 'event_date'
      WHEN 'FLOW_CORPORATE_DAYS' THEN 'corporate_days'
      WHEN 'FLOW_CORPORATE_PERIODS' THEN 'corporate_periods'
      WHEN 'CLARIFY_CORPORATE_DATES' THEN 'corporate_dates'
      WHEN 'FLOW_4_LOCALITY' THEN 'event_location'
      ELSE NULL END,
    'introduced',coalesce((v_context->>'introduced')::boolean,false) OR
      v_next IN ('FLOW_1_SERVICE','FLOW_2_PURPOSE','FLOW_3_DATE','FLOW_4_LOCALITY','FLOW_5_READY'));

  UPDATE core.sessions
  SET context=v_context, current_state=v_next, state_version=state_version+1,
      active_customer_event_id=v_event.id, updated_at=now()
  WHERE id=v_session.id;

  RETURN jsonb_build_object('accepted',true,'duplicate',false,'session_id',v_session.id,
    'contact_id',v_contact,'customer_event_id',v_event.id,
    'changed_keys',to_jsonb(v_changed_keys),'input_event_id',v_inbound,'context',v_context,'next_flow',v_next,
    'missing_required',to_jsonb(v_missing),
    'ready_for_quote_checks',v_next='FLOW_5_READY');
END
$function$;
CREATE OR REPLACE FUNCTION public.cmc_test_enqueue_corporate_v1(p_session_id uuid,p_customer_event_id uuid,p_input_event_id uuid,p_message jsonb,p_quote_result jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE s core.sessions%rowtype; incoming core.events%rowtype; q business.quotes%rowtype; qid uuid; phone text; meta_phone text; txt text;
  fp text; key text; seq integer; queue_id uuid; event_version integer; last_received timestamptz; is_quote boolean;
BEGIN
 SELECT min(recipient_phone),min(phone_number_id) INTO phone,meta_phone FROM public.cmc_test_outbound_queue;
 SELECT x.* INTO s FROM core.sessions x JOIN business.contacts c ON c.id=x.contact_id
 WHERE x.id=p_session_id AND x.active_customer_event_id=p_customer_event_id AND c.whatsapp_id=regexp_replace(phone,'[^0-9]','','g') FOR UPDATE OF x;
 IF s.id IS NULL THEN RAISE EXCEPTION 'not_authorized_meta_test_session';END IF;
 PERFORM 1 FROM business.customer_events WHERE id=p_customer_event_id AND status='active' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'inactive_test_event';END IF;
 IF s.context->'facts'->>'purpose'<>'empresarial' THEN RAISE EXCEPTION 'not_corporate';END IF;
 IF EXISTS(SELECT 1 FROM business.human_handoffs h WHERE h.active AND(h.session_id=s.id OR h.customer_event_id=p_customer_event_id)) THEN RETURN jsonb_build_object('enqueued',false,'reason','HUMAN_LOCK_ACTIVE');END IF;
 SELECT * INTO incoming FROM core.events WHERE id=p_input_event_id AND session_id=s.id AND customer_event_id=p_customer_event_id;
 IF incoming.id IS NULL OR incoming.idempotency_key NOT IN ('meta:'||(s.context->>'last_message_id'),'lab:'||(s.context->>'last_message_id')) THEN RETURN jsonb_build_object('enqueued',false,'reason','STALE_INPUT_EVENT');END IF;
 txt:=p_message->>'text'; is_quote:=p_quote_result IS NOT NULL;
 IF txt IS NULL OR length(txt) NOT BETWEEN 1 AND 4096 OR position(chr(92)||'n' in txt)>0 THEN RAISE EXCEPTION 'invalid_message_format';END IF;
 IF is_quote THEN
  IF s.current_state<>'FLOW_5_READY' OR p_quote_result->>'status'<>'ready' OR p_quote_result->>'pricingRuleVersion'<>'BR-002@1.0'
    OR p_quote_result->'corporate' IS NULL OR coalesce(s.context->'pending_conflicts','{}'::jsonb)<>'{}'::jsonb THEN RAISE EXCEPTION 'quote_not_ready';END IF;
  IF p_quote_result->'availability'->>'status' IS DISTINCT FROM 'preliminary_available' AND position('Gostaria de seguir com a tentativa de reserva' in txt)>0 THEN RAISE EXCEPTION 'booking_invitation_blocked';END IF;
  IF (p_quote_result->'customerVisible'->>'pix')::numeric<=0 OR (p_quote_result->'customerVisible'->>'card')::numeric<=0 THEN RAISE EXCEPTION 'invalid_quote_amount';END IF;
  fp:=md5((s.context->'facts')::text||(p_quote_result->'corporate')::text||(p_quote_result->'pricing_source'->>'revision_id'));
  SELECT * INTO q FROM business.quotes WHERE customer_event_id=p_customer_event_id AND fingerprint=fp;
  IF q.id IS NULL THEN
    UPDATE business.quotes SET status='superseded' WHERE customer_event_id=p_customer_event_id AND status IN('ready','presented');
    UPDATE public.cmc_test_outbound_queue SET status='cancelled',last_error='QUOTE_SUPERSEDED',updated_at=now()
       WHERE customer_event_id=p_customer_event_id AND payload->>'kind'='corporate_quote' AND status IN('pending','failed');
    SELECT coalesce(max(quote_version),0)+1 INTO event_version FROM business.quotes WHERE customer_event_id=p_customer_event_id;
    INSERT INTO business.quotes(customer_event_id,quote_version,status,total_pix,total_card,pricing_source,pricing_snapshot,rule_set_version,locality_id,pricing_tier_id,event_date_snapshot,fingerprint)
    VALUES(p_customer_event_id,event_version,'ready',(p_quote_result->'customerVisible'->>'pix')::numeric,(p_quote_result->'customerVisible'->>'card')::numeric,
      p_quote_result->'pricing_source'->>'url',jsonb_build_object('quote_result',p_quote_result,'message_text',txt,'environment','Meta TEST','input_source',incoming.source),
      'BR-002@1.0',(p_quote_result->'pricing_source'->>'locality_id')::uuid,(p_quote_result->'pricing_source'->>'tier_id')::uuid,
      (s.context->'facts'->>'data_inicio')::date,fp) RETURNING * INTO q;
    INSERT INTO core.events(session_id,customer_event_id,event_type,direction,source,idempotency_key,payload)
      VALUES(s.id,p_customer_event_id,'quote_generated','internal','quote_engine','br002:generated:'||q.id,jsonb_build_object('quote_id',q.id,'rule','BR-002','input_event_id',incoming.id)) ON CONFLICT(idempotency_key) DO NOTHING;
  END IF;
  key:='br002:quote:'||q.id;
 ELSE
  IF s.current_state='HUMAN_LOCK_NO_REPLY' THEN RETURN jsonb_build_object('enqueued',false,'reason','HUMAN_LOCK_ACTIVE');END IF;
  key:='br002:question:'||incoming.id;
 END IF;
 IF incoming.source<>'meta_whatsapp' THEN RETURN jsonb_build_object('enqueued',false,'reason','LAB_REPLAY_NO_DISPATCH','quote_id',q.id,'draft_text',txt);END IF;
 SELECT max(occurred_at) INTO last_received FROM core.events WHERE session_id=s.id AND event_type='message_received' AND source='meta_whatsapp' AND occurred_at<=now();
 IF last_received IS NULL OR last_received<=now()-interval '24 hours' THEN RETURN jsonb_build_object('enqueued',false,'reason','META_WINDOW_CLOSED','quote_id',q.id);END IF;
 SELECT coalesce(max(sequence_no),0)+10 INTO seq FROM public.cmc_test_outbound_queue WHERE customer_event_id=p_customer_event_id;
 INSERT INTO public.cmc_test_outbound_queue(idempotency_key,recipient_phone,phone_number_id,customer_event_id,session_id,sequence_no,message_type,payload,due_at,status)
 VALUES(key,phone,meta_phone,p_customer_event_id,s.id,seq,'text',jsonb_build_object('text',txt,'kind',CASE WHEN is_quote THEN 'corporate_quote' ELSE 'qualification' END,
   'quote_id',q.id,'input_event_id',incoming.id,'state_version',s.state_version,'facts_hash',md5((s.context->'facts')::text)),now(),'pending') ON CONFLICT(idempotency_key) DO NOTHING RETURNING id INTO queue_id;
 RETURN jsonb_build_object('enqueued',queue_id IS NOT NULL,'duplicate',queue_id IS NULL,'queue_id',queue_id,'quote_id',q.id);
END $fn$;
REVOKE ALL ON FUNCTION public.cmc_test_enqueue_corporate_v1(uuid,uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cmc_test_enqueue_corporate_v1(uuid,uuid,uuid,jsonb,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.cmc_test_claim_outbound()
RETURNS SETOF public.cmc_test_outbound_queue LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE claimed public.cmc_test_outbound_queue;
BEGIN
 UPDATE public.cmc_test_outbound_queue q SET status='cancelled',updated_at=now(),last_error='TEST_SCOPE_OR_WINDOW_OR_HUMAN_GUARD'
 WHERE q.status IN('pending','failed') AND (
  NOT EXISTS(SELECT 1 FROM core.sessions s WHERE s.id=q.session_id AND s.active_customer_event_id=q.customer_event_id AND s.status='active') OR
  EXISTS(SELECT 1 FROM business.human_handoffs h WHERE h.active AND(h.session_id=q.session_id OR h.customer_event_id=q.customer_event_id)) OR
  NOT EXISTS(SELECT 1 FROM core.events e WHERE e.session_id=q.session_id AND e.event_type='message_received' AND e.source='meta_whatsapp' AND e.occurred_at>now()-interval '24 hours' AND e.occurred_at<=now()) OR
  (q.payload->>'kind'='qualification' AND q.payload ? 'state_version' AND (q.payload->>'state_version')::bigint<>(SELECT s.state_version FROM core.sessions s WHERE s.id=q.session_id)) OR
  (q.payload->>'kind'='corporate_quote' AND q.payload ? 'facts_hash' AND q.payload->>'facts_hash'<>(SELECT md5((s.context->'facts')::text) FROM core.sessions s WHERE s.id=q.session_id)));
 -- An uncertain dispatch is quarantined; never blindly retry a potentially accepted Meta message.
 UPDATE public.cmc_test_outbound_queue SET status='failed',attempts=max_attempts,last_error='UNCERTAIN_DISPATCH_REQUIRES_HUMAN',updated_at=now()
 WHERE status='processing' AND updated_at<now()-interval '10 minutes';
 WITH candidate AS (
  SELECT q.id FROM public.cmc_test_outbound_queue q WHERE q.status IN('pending','failed') AND q.due_at<=now()
   AND coalesce(q.next_attempt_at,q.due_at)<=now() AND q.attempts<q.max_attempts
   AND NOT EXISTS(SELECT 1 FROM public.cmc_test_outbound_queue p WHERE p.customer_event_id=q.customer_event_id AND p.sequence_no<q.sequence_no AND p.status NOT IN('sent','cancelled'))
  ORDER BY q.due_at,q.sequence_no FOR UPDATE SKIP LOCKED LIMIT 1)
 UPDATE public.cmc_test_outbound_queue q SET status='processing',attempts=q.attempts+1,updated_at=now() FROM candidate c WHERE q.id=c.id RETURNING q.* INTO claimed;
 IF claimed.id IS NOT NULL THEN RETURN NEXT claimed;END IF;
END $fn$;


REVOKE ALL ON FUNCTION public.cmc_test_claim_outbound() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cmc_test_claim_outbound() TO service_role;
