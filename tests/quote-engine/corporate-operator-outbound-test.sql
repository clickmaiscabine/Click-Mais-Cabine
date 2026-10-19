-- Explicit operator-authorized LAB outbound validation, NOT a fabricated inbound/E2E.
-- Reuses the existing constrained TEST queue and an already open genuine Meta window.
-- Idempotent for the active synthetic quote. Never creates message_received or changes occurred_at.
BEGIN;
DO $test$
DECLARE s core.sessions%rowtype; q business.quotes%rowtype; txt text; phone text; meta_phone text; seq integer;
BEGIN
 SELECT min(recipient_phone),min(phone_number_id) INTO phone,meta_phone FROM public.cmc_test_outbound_queue;
 SELECT x.* INTO s FROM core.sessions x JOIN business.contacts c ON c.id=x.contact_id
 WHERE c.whatsapp_id=regexp_replace(phone,'[^0-9]','','g') AND x.status='active' FOR UPDATE OF x;
 SELECT * INTO q FROM business.quotes WHERE customer_event_id=s.active_customer_event_id AND rule_set_version='BR-002@1.0' AND status IN('ready','presented') ORDER BY quote_version DESC LIMIT 1;
 IF q.id IS NULL OR s.current_state<>'FLOW_5_READY' OR q.pricing_snapshot->>'input_source'<>'lab_replay' THEN RAISE EXCEPTION 'run synthetic LAB corporate replay first';END IF;
 IF EXISTS(SELECT 1 FROM business.human_handoffs WHERE active AND(session_id=s.id OR customer_event_id=q.customer_event_id)) THEN RAISE EXCEPTION 'human lock';END IF;
 IF NOT EXISTS(SELECT 1 FROM core.events WHERE session_id=s.id AND event_type='message_received' AND source='meta_whatsapp' AND occurred_at>now()-interval '24 hours' AND occurred_at<=now()) THEN RAISE EXCEPTION 'real Meta window closed';END IF;
 txt:='*TESTE LAB — cenário simulado*'||chr(10)||chr(10)||(q.pricing_snapshot->>'message_text');
 IF length(txt)>4096 OR position(chr(92)||'n' in txt)>0 THEN RAISE EXCEPTION 'invalid format';END IF;
 SELECT coalesce(max(sequence_no),0)+10 INTO seq FROM public.cmc_test_outbound_queue WHERE customer_event_id=q.customer_event_id;
 INSERT INTO core.events(session_id,customer_event_id,event_type,direction,source,idempotency_key,payload)
 VALUES(s.id,q.customer_event_id,'lab_outbound_validation_requested','internal','lab_operator','br002:operator-validation:'||q.id,
 jsonb_build_object('quote_id',q.id,'synthetic_scenario',true,'real_meta_window_required',true)) ON CONFLICT(idempotency_key) DO NOTHING;
 INSERT INTO public.cmc_test_outbound_queue(idempotency_key,recipient_phone,phone_number_id,session_id,customer_event_id,sequence_no,message_type,payload,due_at)
 VALUES('br002:operator-validation:'||q.id,phone,meta_phone,s.id,q.customer_event_id,seq,'text',
 jsonb_build_object('text',txt,'kind','corporate_quote','quote_id',q.id,'origin','lab_operator_outbound_validation','facts_hash',md5((s.context->'facts')::text)),now()) ON CONFLICT(idempotency_key) DO NOTHING;
END $test$;
COMMIT;
SELECT status,attempts,meta_message_id IS NOT NULL AS has_meta_confirmation,meta_delivery_status
FROM public.cmc_test_outbound_queue WHERE idempotency_key LIKE 'br002:operator-validation:%' ORDER BY created_at DESC LIMIT 1;
