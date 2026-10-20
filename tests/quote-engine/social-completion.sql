-- Isolated DB integration; never fabricates Meta input or an open window.
BEGIN;
SET LOCAL ROLE service_role;
DO $test$
DECLARE r jsonb; c jsonb; e jsonb; sid uuid; eid uuid; inbound uuid; n integer;
BEGIN
 SELECT count(*) INTO n FROM public.cmc_test_outbound_queue;
 PERFORM public.cmc_reset_meta_test_session_v1();
 r:=public.cm_quote_flow1_apply_v1('5511956390586','synthetic-social-completion-1',
 '{"services":["totem_fotos"],"purpose":"debutante","event_date":"2026-11-05","city":"guarulhos"}',
 '{"_transport":"lab_replay"}','synthetic social qualification','commercial',now());
 IF r->>'next_flow'<>'FLOW_5_READY' THEN RAISE EXCEPTION 'social readiness failed';END IF;
 sid:=(r->>'session_id')::uuid;eid:=(r->>'customer_event_id')::uuid;inbound:=(r->>'input_event_id')::uuid;
 c:=public.cmc_test_quote_context_v1(sid,eid,inbound);
 IF c->'facts'->>'event_type'<>'debutante' OR jsonb_array_length(c->'event_dates')<>1 OR (c->'facts')?'dias_evento' THEN RAISE EXCEPTION 'social contract contaminated by corporate facts';END IF;
 IF (c->'rule_set'->>'cardSurchargeRate')::numeric<>0.18 THEN RAISE EXCEPTION 'social rule set mismatch';END IF;
 e:=public.cmc_test_enqueue_corporate_v1(sid,eid,inbound,'{"text":"synthetic social question"}',NULL);
 IF e->>'reason'<>'LAB_REPLAY_NO_DISPATCH' THEN RAISE EXCEPTION 'social replay dispatched';END IF;
 IF (SELECT count(*) FROM public.cmc_test_outbound_queue)<>n THEN RAISE EXCEPTION 'replay changed queue';END IF;
 -- Changing a known date creates a conflict until explicitly confirmed.
 r:=public.cm_quote_flow1_apply_v1('5511956390586','synthetic-social-date-correction','{"event_date":"2026-11-06"}','{"_transport":"lab_replay"}','synthetic correction','commercial',now());
 IF r->>'next_flow'<>'CLARIFY_CONFLICT' THEN RAISE EXCEPTION 'social correction bypassed conflict';END IF;
 r:=public.cm_quote_flow1_apply_v1('5511956390586','synthetic-social-date-confirm','{"event_date":"2026-11-06"}','{"_transport":"lab_replay"}','synthetic confirmation','commercial',now());
 IF r->>'next_flow'<>'FLOW_5_READY' OR r->'context'->'facts'->>'event_date'<>'2026-11-06' THEN RAISE EXCEPTION 'correction not committed';END IF;
 -- The agenda-confirmation menu is a narrow state transition: 1 keeps the
 -- date and proceeds; 2 clears only that date, retaining social qualification.
 PERFORM public.cmc_reset_meta_test_session_v1();
 r:=public.cm_quote_flow1_apply_v1('5511956390586','synthetic-social-date-menu-a',
  '{"services":["totem_fotos"],"purpose":"aniversario","event_date":"2026-12-15"}',
  '{"_transport":"lab_replay"}','synthetic date','commercial',now());
 IF r->'context'->>'pending_question'<>'social_date_confirmation' THEN RAISE EXCEPTION 'social confirmation state missing';END IF;
 r:=public.cm_quote_flow1_apply_v1('5511956390586','synthetic-social-date-menu-b','{"social_date_action":"confirm"}','{"_transport":"lab_replay"}','1','commercial',now());
 IF r->'context'->>'pending_question'<>'event_location' OR r->'context'->'facts'->>'event_date'<>'2026-12-15' THEN RAISE EXCEPTION 'social date continue failed';END IF;
 PERFORM public.cmc_reset_meta_test_session_v1();
 r:=public.cm_quote_flow1_apply_v1('5511956390586','synthetic-social-date-menu-c',
  '{"services":["totem_fotos"],"purpose":"aniversario","event_date":"2026-12-15"}',
  '{"_transport":"lab_replay"}','synthetic date','commercial',now());
 r:=public.cm_quote_flow1_apply_v1('5511956390586','synthetic-social-date-menu-d','{"social_date_action":"redo"}','{"_transport":"lab_replay"}','2','commercial',now());
 IF r->>'next_flow'<>'FLOW_3_DATE' OR r->'context'->'facts'?'event_date' OR r->'context'->'facts'->>'purpose'<>'aniversario' THEN RAISE EXCEPTION 'social date redo failed';END IF;
 r:=public.cm_quote_flow1_apply_v1('5511956390586','synthetic-social-human','{}','{"_transport":"lab_replay","_handoff_reason":"HND-EXPLICIT-HUMAN"}','synthetic human request','commercial',now());
 IF r->>'next_flow'<>'HUMAN_LOCK_NO_REPLY' THEN RAISE EXCEPTION 'social human guard failed';END IF;
END $test$;
ROLLBACK;
SELECT 'social contracts, readiness, rules, replay no-send, correction/conflict, date confirm/redo, human handoff: PASS (rollback)' AS result;
