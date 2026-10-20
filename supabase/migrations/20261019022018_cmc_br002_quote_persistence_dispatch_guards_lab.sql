CREATE OR REPLACE FUNCTION public.cmc_test_quote_context_v1(p_session_id uuid,p_customer_event_id uuid,p_input_event_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE s core.sessions%rowtype; f jsonb; e core.events%rowtype; phone text;
BEGIN
 SELECT regexp_replace(min(recipient_phone),'[^0-9]','','g') INTO phone FROM public.cmc_test_outbound_queue;
 SELECT x.* INTO s FROM core.sessions x JOIN business.contacts c ON c.id=x.contact_id
 WHERE x.id=p_session_id AND x.active_customer_event_id=p_customer_event_id AND c.whatsapp_id=phone;
 IF s.id IS NULL THEN RAISE EXCEPTION 'not_authorized_meta_test_session'; END IF;
 SELECT * INTO e FROM core.events WHERE id=p_input_event_id AND session_id=s.id AND customer_event_id=p_customer_event_id;
 IF e.id IS NULL OR e.idempotency_key NOT IN ('meta:'||(s.context->>'last_message_id'),'lab:'||(s.context->>'last_message_id')) THEN RAISE EXCEPTION 'stale_input_event';END IF;
 f:=s.context->'facts';
 IF f->>'purpose'<>'empresarial' OR s.current_state<>'FLOW_5_READY' OR coalesce(s.context->'pending_conflicts','{}'::jsonb)<>'{}'::jsonb THEN RAISE EXCEPTION 'corporate_qualification_not_ready';END IF;
 RETURN jsonb_build_object(
  '_routing',jsonb_build_object('session_id',s.id,'customer_event_id',p_customer_event_id,'input_event_id',p_input_event_id,'state_version',s.state_version),
  'facts',jsonb_build_object('event_type','empresarial','service_interest',(SELECT jsonb_agg(CASE WHEN x='fotografo' THEN 'fotografo_evento' ELSE x END) FROM jsonb_array_elements_text(f->'services') x),
    'locality',CASE WHEN f->>'city'='sao paulo' THEN f->>'district' ELSE f->>'city' END,
    'event_date',f->'data_inicio','data_inicio',f->'data_inicio','data_fim',f->'data_fim','event_dates',f->'event_dates','dias_evento',f->'dias_evento','periodos_por_dia',f->'periodos_por_dia'),
  'event_dates',f->'event_dates',
  'human_lock',EXISTS(SELECT 1 FROM business.human_handoffs h WHERE h.active AND(h.session_id=s.id OR h.customer_event_id=p_customer_event_id)),
  'reference_date',to_char(now() AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD'),
  'localities',(SELECT jsonb_agg(l) FROM catalog.localities l),
  'locality_aliases',(SELECT jsonb_agg(a) FROM catalog.locality_aliases a WHERE a.active),
  'pricing_tiers',(SELECT jsonb_agg(t) FROM catalog.pricing_tiers t),
  'services',(SELECT jsonb_agg(jsonb_build_object('code',v.code,'category',v.category,'active',v.active,'quoteableAutomatically',v.quoteable_automatically,'quantity',1))
     FROM catalog.services v WHERE v.code IN(SELECT CASE WHEN x='fotografo' THEN 'fotografo_evento' ELSE x END FROM jsonb_array_elements_text(f->'services') x)),
  'pricing_source',jsonb_build_object('file_id','1ZkoS54blFcWQxC66OTnHuI9ZBu_ErFmH','revision_id','0B6VWt3lEydcWUFVOSTYrS0RESm9NRERaUUpBNzNMUm9IcG4wPQ'),
  'reservations',coalesce((SELECT jsonb_agg(jsonb_build_object('trello_card_id',r.trello_card_id,'data_evento',r.data_evento,'status',r.status)) FROM public.cmc_agenda_reservas r
    WHERE r.status='ativa' AND r.data_evento IN(SELECT x::date FROM jsonb_array_elements_text(f->'event_dates') x)),'[]'::jsonb));
END $fn$;
REVOKE ALL ON FUNCTION public.cmc_test_quote_context_v1(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cmc_test_quote_context_v1(uuid,uuid,uuid) TO service_role;

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
   'quote_id',q.id,'input_event_id',incoming.id,'state_version',s.state_version),now(),'pending') ON CONFLICT(idempotency_key) DO NOTHING RETURNING id INTO queue_id;
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
  (q.payload ? 'state_version' AND (q.payload->>'state_version')::bigint<>(SELECT s.state_version FROM core.sessions s WHERE s.id=q.session_id)));
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

CREATE OR REPLACE FUNCTION public.cmc_test_mark_outbound_sent(p_id uuid,p_meta_message_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE q public.cmc_test_outbound_queue; generated core.events%rowtype; event_row business.customer_events%rowtype; eid uuid; delay interval;
BEGIN
 IF p_meta_message_id IS NULL THEN RAISE EXCEPTION 'meta_message_id_missing';END IF;
 SELECT * INTO q FROM public.cmc_test_outbound_queue WHERE id=p_id FOR UPDATE;
 IF q.id IS NULL THEN RAISE EXCEPTION 'queue_row_missing';END IF;
 IF q.status='sent' AND q.meta_message_id=p_meta_message_id THEN RETURN jsonb_build_object('id',q.id,'status','sent','duplicate',true);END IF;
 IF q.status<>'processing' THEN RAISE EXCEPTION 'queue_not_processing';END IF;
 UPDATE public.cmc_test_outbound_queue SET status='sent',meta_message_id=p_meta_message_id,sent_at=now(),updated_at=now(),last_error=NULL,next_attempt_at=NULL WHERE id=q.id;
 INSERT INTO core.events(session_id,customer_event_id,event_type,direction,source,idempotency_key,payload)
 VALUES(q.session_id,q.customer_event_id,CASE WHEN q.payload->>'kind'='corporate_quote' THEN 'quote_sent' ELSE 'message_sent' END,'outbound','meta_whatsapp',
   'meta:outbound:'||p_meta_message_id,jsonb_build_object('queue_id',q.id,'quote_id',q.payload->'quote_id','meta_message_id',p_meta_message_id))
 ON CONFLICT(idempotency_key) DO NOTHING RETURNING id INTO eid;
 IF q.payload->>'kind'='corporate_quote' THEN
  UPDATE business.quotes SET status='presented',presented_at=now(),presented_message_event_id=eid WHERE id=(q.payload->>'quote_id')::uuid AND status='ready';
  SELECT * INTO event_row FROM business.customer_events WHERE id=q.customer_event_id FOR UPDATE;
  IF event_row.commercial_stage='PRE_QUOTE' THEN
   PERFORM business.transition_customer_event(event_row.id,event_row.stage_version,'ORCAMENTO','system','meta_test_dispatch','ORCAMENTO_ENVIADO',eid,'{"rule":"BR-002"}'::jsonb);
  END IF;
  UPDATE business.customer_events SET qualified_at=coalesce(qualified_at,now()),lifecycle_stage='quote_presented' WHERE id=q.customer_event_id;
 END IF;
 delay:=CASE q.sequence_no WHEN 30 THEN interval '5 seconds' WHEN 40 THEN interval '5 minutes' WHEN 102 THEN interval '5 seconds' WHEN 103 THEN interval '5 minutes' ELSE interval '2 minutes' END;
 UPDATE public.cmc_test_outbound_queue p SET due_at=greatest(p.due_at,now()+delay),updated_at=now()
 WHERE p.customer_event_id=q.customer_event_id AND p.sequence_no=(SELECT min(n.sequence_no) FROM public.cmc_test_outbound_queue n WHERE n.customer_event_id=q.customer_event_id AND n.sequence_no>q.sequence_no AND n.status='pending');
 RETURN jsonb_build_object('id',q.id,'status','sent','meta_message_id',p_meta_message_id);
END $fn$;
REVOKE ALL ON FUNCTION public.cmc_test_claim_outbound() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.cmc_test_mark_outbound_sent(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cmc_test_claim_outbound(),public.cmc_test_mark_outbound_sent(uuid,text) TO service_role;
