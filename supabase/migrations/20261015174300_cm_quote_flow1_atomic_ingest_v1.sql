-- Flow 1 Click Mais: atomic ingestion (whatsapp inbound only)
-- Safe for concurrent messages from same sender via transaction-scoped advisory lock.
-- Only service_role may invoke the public RPC endpoint.
CREATE OR REPLACE FUNCTION public.cm_quote_flow1_apply_v1(
  p_sender_id text,
  p_external_message_id text,
  p_extracted jsonb DEFAULT '{}'::jsonb,
  p_evidence jsonb DEFAULT '{}'::jsonb,
  p_message_text text DEFAULT NULL,
  p_category text DEFAULT 'commercial',
  p_occurred_at timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
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
     (v_event.status <> 'active' OR v_event.commercial_stage <> 'PRE_QUOTE'
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
    (v_session.id, v_event.id, 'message_received', 'inbound', 'meta_whatsapp',
     'meta:' || p_external_message_id, jsonb_build_object(
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

  -- Only agreed fields are admitted. Any proposed replacement becomes a
  -- pending conflict until a subsequent message explicitly confirms a value.
  FOR v_key, v_val IN SELECT key, value FROM jsonb_each(p_extracted) LOOP
    IF v_key NOT IN ('services','purpose','event_date','event_date_partial','city',
                     'district','venue_name','venue_address','contact_name',
                     'relationship_to_event','acquisition_source') THEN
      RAISE EXCEPTION 'unsupported_quote_fact: %', v_key;
    END IF;
    IF v_val IS NULL OR v_val = 'null'::jsonb OR v_val = '""'::jsonb OR v_val = '[]'::jsonb THEN
      CONTINUE;
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
    ELSIF jsonb_typeof(v_val) <> 'string' THEN
      RAISE EXCEPTION 'invalid_fact_type: %', v_key;
    END IF;
    IF v_key = 'event_date' THEN
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
    ELSIF v_old IS NOT NULL AND v_val IS DISTINCT FROM v_old THEN
      v_pending := jsonb_set(v_pending, ARRAY[v_key],
                      jsonb_build_object('existing', v_old, 'incoming', v_val), true);
    ELSIF v_old IS NULL THEN
      v_changed := true;
    END IF;

    IF NOT v_changed THEN CONTINUE; END IF;

    v_facts := jsonb_set(v_facts, ARRAY[v_key], v_val, true);
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

  IF NOT (v_facts ? 'services') THEN v_missing := array_append(v_missing,'service'); END IF;
  IF NOT (v_facts ? 'purpose') THEN v_missing := array_append(v_missing,'purpose'); END IF;
  IF NOT (v_facts ? 'event_date') THEN v_missing := array_append(v_missing,'event_date'); END IF;
  IF NOT (v_facts ? 'city') OR
     (v_facts->>'city' = 'sao paulo' AND NOT (v_facts ? 'district')) THEN
    v_missing := array_append(v_missing,'event_location');
  END IF;

  SELECT EXISTS(SELECT 1 FROM business.human_handoffs
    WHERE active AND (session_id = v_session.id OR customer_event_id = v_event.id))
    INTO v_human_locked;

  IF v_human_locked THEN v_next := 'HUMAN_LOCK_NO_REPLY';
  ELSIF v_pending <> '{}'::jsonb THEN v_next := 'CLARIFY_CONFLICT';
  ELSIF array_length(v_missing,1) IS NULL THEN v_next := 'FLOW_5_READY';
  ELSIF v_missing[1] = 'service' THEN v_next := 'FLOW_1_SERVICE';
  ELSIF v_missing[1] = 'purpose' THEN v_next := 'FLOW_2_PURPOSE';
  ELSIF v_missing[1] = 'event_date' THEN v_next := 'FLOW_3_DATE';
  ELSE v_next := 'FLOW_4_LOCALITY';
  END IF;

  v_context := v_context || jsonb_build_object(
    'facts',v_facts,'pending_conflicts',v_pending,
    'last_message_id',p_external_message_id,
    'last_flow',v_next,
    'missing_required',to_jsonb(v_missing));
  UPDATE core.sessions
  SET context=v_context, current_state=v_next, state_version=state_version+1,
      active_customer_event_id=v_event.id, updated_at=now()
  WHERE id=v_session.id;

  RETURN jsonb_build_object('accepted',true,'duplicate',false,'session_id',v_session.id,
    'contact_id',v_contact,'customer_event_id',v_event.id,
    'input_event_id',v_inbound,'context',v_context,'next_flow',v_next,
    'missing_required',to_jsonb(v_missing),
    'ready_for_quote_checks',v_next='FLOW_5_READY');
END
$fn$;
REVOKE ALL ON FUNCTION public.cm_quote_flow1_apply_v1(text,text,jsonb,jsonb,text,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cm_quote_flow1_apply_v1(text,text,jsonb,jsonb,text,text,timestamptz) TO service_role;
COMMENT ON FUNCTION public.cm_quote_flow1_apply_v1(text,text,jsonb,jsonb,text,text,timestamptz)
IS 'Click Mais Flow 1: per-sender atomic merge and next-flow routing; no outbound messaging or pricing.';
