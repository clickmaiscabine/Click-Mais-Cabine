-- LAB integration checks. Every mutation is rolled back. No fabricated Meta input/window.
BEGIN;
SET LOCAL statement_timeout='8000ms';
SET LOCAL ROLE service_role;
DO $test$
DECLARE sender text; r jsonb; context_result jsonb; enq jsonb; quote_result jsonb;
 sid uuid; eid uuid; incoming uuid; handoff uuid; fixture uuid; claimed integer; baseline integer;
BEGIN
 SELECT regexp_replace(min(recipient_phone),'[^0-9]','','g') INTO sender FROM public.cmc_test_outbound_queue;
 SELECT pricing_snapshot->'quote_result' INTO quote_result FROM business.quotes WHERE rule_set_version='BR-002@1.0' ORDER BY created_at DESC LIMIT 1;
 IF quote_result IS NULL THEN RAISE EXCEPTION 'run corporate LAB replay first';END IF;
 PERFORM public.cmc_reset_meta_test_session_v1();
 SELECT count(*) INTO baseline FROM public.cmc_test_outbound_queue;
 r:=public.cm_quote_flow1_apply_v1(sender,'synthetic-persistence-full',
  '{"services":["cabine_fotos"],"purpose":"empresarial","dias_evento":3,"periodos_por_dia":2,"city":"suzano","data_inicio":"2026-11-01","data_fim":"2026-11-03","event_date":"2026-11-01","event_dates":["2026-11-01","2026-11-02","2026-11-03"]}',
  '{"_transport":"lab_replay"}','LAB synthetic persistence case','commercial',now());
 IF r->>'next_flow'<>'FLOW_5_READY' THEN RAISE EXCEPTION 'readiness failed: %',r;END IF;
 sid:=(r->>'session_id')::uuid;eid:=(r->>'customer_event_id')::uuid;incoming:=(r->>'input_event_id')::uuid;
 IF (SELECT source FROM core.events WHERE id=incoming)<>'lab_replay' THEN RAISE EXCEPTION 'replay incorrectly treated as Meta';END IF;
 context_result:=public.cmc_test_quote_context_v1(sid,eid,incoming);
 IF jsonb_array_length(context_result->'event_dates')<>3 THEN RAISE EXCEPTION 'missing event dates';END IF;
 enq:=public.cmc_test_enqueue_corporate_v1(sid,eid,incoming,'{"text":"LAB synthetic budget, no dispatch"}',quote_result);
 IF enq->>'reason'<>'LAB_REPLAY_NO_DISPATCH' THEN RAISE EXCEPTION 'replay dispatch guard failed';END IF;
 PERFORM public.cmc_test_enqueue_corporate_v1(sid,eid,incoming,'{"text":"LAB synthetic budget, no dispatch"}',quote_result);
 IF (SELECT count(*) FROM business.quotes WHERE customer_event_id=eid)<>1 THEN RAISE EXCEPTION 'duplicate quote persisted';END IF;
 IF (SELECT count(*) FROM public.cmc_test_outbound_queue)<>baseline THEN RAISE EXCEPTION 'replay enqueued a message';END IF;
 r:=public.cm_quote_flow1_apply_v1(sender,'synthetic-persistence-full','{}','{"_transport":"lab_replay"}','duplicate','commercial',now());
 IF r->>'next_flow'<>'DUPLICATE_NOOP' THEN RAISE EXCEPTION 'duplicate input not ignored';END IF;
 enq:=public.cmc_test_enqueue_corporate_v1(sid,eid,gen_random_uuid(),'{"text":"stale"}',NULL);
 IF enq->>'reason'<>'STALE_INPUT_EVENT' THEN RAISE EXCEPTION 'stale input guard failed';END IF;
 BEGIN
  PERFORM public.cmc_test_enqueue_corporate_v1(sid,eid,incoming,jsonb_build_object('text','bad'||chr(92)||'nformat'),NULL);
  RAISE EXCEPTION 'format guard unexpectedly accepted input';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM<>'invalid_message_format' THEN RAISE;END IF;
 END;
 INSERT INTO business.human_handoffs(customer_event_id,session_id,reason_code,source,metadata)
 VALUES(eid,sid,'LAB_SYNTHETIC_GUARD_TEST','lab_test','{"rollback_only":true}') RETURNING id INTO handoff;
 enq:=public.cmc_test_enqueue_corporate_v1(sid,eid,incoming,'{"text":"blocked by human"}',quote_result);
 IF enq->>'reason'<>'HUMAN_LOCK_ACTIVE' THEN RAISE EXCEPTION 'human lock enqueue guard failed';END IF;
 INSERT INTO public.cmc_test_outbound_queue(idempotency_key,customer_event_id,session_id,sequence_no,message_type,payload,due_at)
 VALUES('synthetic-human-guard',eid,sid,10001,'text','{"text":"synthetic guard"}',now()) RETURNING id INTO fixture;
 SELECT count(*) INTO claimed FROM public.cmc_test_claim_outbound();
 IF claimed<>0 OR (SELECT status FROM public.cmc_test_outbound_queue WHERE id=fixture)<>'cancelled' THEN RAISE EXCEPTION 'human lock claim guard failed';END IF;
 r:=public.cm_quote_flow1_apply_v1(sender,'synthetic-human-followup','{}','{"_transport":"lab_replay"}','synthetic followup','commercial',now());
 IF r->>'next_flow'<>'HUMAN_LOCK_NO_REPLY' THEN RAISE EXCEPTION 'human lock response guard failed';END IF;
 UPDATE business.human_handoffs SET active=false,released_at=now() WHERE id=handoff;
 INSERT INTO public.cmc_test_outbound_queue(idempotency_key,customer_event_id,session_id,sequence_no,message_type,payload,due_at)
 VALUES('synthetic-stale-facts',eid,sid,10002,'text','{"text":"synthetic","kind":"corporate_quote","facts_hash":"stale"}',now()) RETURNING id INTO fixture;
 SELECT count(*) INTO claimed FROM public.cmc_test_claim_outbound();
 IF claimed<>0 OR (SELECT status FROM public.cmc_test_outbound_queue WHERE id=fixture)<>'cancelled' THEN RAISE EXCEPTION 'stale quote guard failed';END IF;
 INSERT INTO public.cmc_test_outbound_queue(idempotency_key,customer_event_id,session_id,sequence_no,message_type,payload,due_at,status,updated_at)
 VALUES('synthetic-uncertain-send',eid,sid,10003,'text','{"text":"synthetic"}',now(),'processing',now()-interval '11 minutes') RETURNING id INTO fixture;
 SELECT count(*) INTO claimed FROM public.cmc_test_claim_outbound();
 IF claimed<>0 OR NOT EXISTS(SELECT 1 FROM public.cmc_test_outbound_queue WHERE id=fixture AND attempts=max_attempts AND last_error='UNCERTAIN_DISPATCH_REQUIRES_HUMAN') THEN RAISE EXCEPTION 'uncertain send retried';END IF;
 PERFORM public.cmc_reset_meta_test_session_v1();
 r:=public.cm_quote_flow1_apply_v1(sender,'synthetic-special-operation','{"services":["cabine_fotos"],"purpose":"empresarial","dias_evento":1,"periodos_por_dia":4}','{"_transport":"lab_replay"}','synthetic special operation','commercial',now());
 IF r->>'next_flow'<>'HUMAN_LOCK_NO_REPLY' OR NOT EXISTS(SELECT 1 FROM business.human_handoffs WHERE session_id=sid AND active AND reason_code='HND-SPECIAL-OPERATION') THEN RAISE EXCEPTION 'special operation did not create actual handoff';END IF;
 PERFORM public.cmc_reset_meta_test_session_v1();
 r:=public.cm_quote_flow1_apply_v1(sender,'synthetic-explicit-human','{"purpose":"empresarial"}','{"_transport":"lab_replay","_handoff_reason":"HND-EXPLICIT-HUMAN"}','synthetic explicit human','commercial',now());
 IF r->>'next_flow'<>'HUMAN_LOCK_NO_REPLY' OR NOT EXISTS(SELECT 1 FROM business.human_handoffs WHERE session_id=sid AND active AND reason_code='HND-EXPLICIT-HUMAN') THEN RAISE EXCEPTION 'explicit request did not create actual handoff';END IF;
 PERFORM public.cmc_reset_meta_test_session_v1();
 r:=public.cm_quote_flow1_apply_v1(sender,'synthetic-price-human','{"purpose":"empresarial"}','{"_transport":"lab_replay"}','synthetic engine exception','commercial',now());
 enq:=public.cmc_test_enqueue_corporate_v1(sid,(r->>'customer_event_id')::uuid,(r->>'input_event_id')::uuid,'{"handoff_reason":"HND-PRICE-NOT-AUTHORIZED","blockers":["synthetic engine failure"]}',NULL);
 IF enq->>'reason'<>'HUMAN_HANDOFF_CREATED' OR NOT EXISTS(SELECT 1 FROM business.human_handoffs WHERE session_id=sid AND active AND reason_code='HND-PRICE-NOT-AUTHORIZED') THEN RAISE EXCEPTION 'engine exception did not create actual handoff';END IF;
END $test$;
ROLLBACK;
SELECT 'corporate persistence: readiness, provenance, all dates, replay no-dispatch, duplicate input/quote, stale input, formatting, human enqueue/claim/response, stale facts, uncertain dispatch: PASS (rollback)' AS result;
