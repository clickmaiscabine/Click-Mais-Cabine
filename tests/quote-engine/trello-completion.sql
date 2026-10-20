-- Uses a confirmed TEST quote, but all DB effects are rolled back.
-- No call to Trello/Meta and no simulated inbound/window.
BEGIN;
SET LOCAL ROLE service_role;
UPDATE integrations.trello_projections SET metadata=metadata-'desired_hash' WHERE board_id='6ad446503b529e753ac4b878' AND customer_event_id IN(SELECT active_customer_event_id FROM core.sessions WHERE external_session_key='whatsapp:5511956390586');
DO $test$
DECLARE c jsonb; p jsonb; receipt jsonb; r jsonb;
BEGIN
 c:=public.cmc_test_trello_claim_v1();
 IF c IS NULL THEN RAISE EXCEPTION 'no confirmed TEST quote eligible for isolated projection check';END IF;
 IF c->>'board_id'<>'6ad446503b529e753ac4b878' OR c->>'lab_scope'<>'true' THEN RAISE EXCEPTION 'scope guard failed';END IF;
 IF public.cmc_test_trello_claim_v1() IS NOT NULL THEN RAISE EXCEPTION 'lease permitted concurrent claim';END IF;
 p:=jsonb_build_object('stage_version',c->'stage_version','quote_id',c->'quote'->'id','quote_version',c->'quote'->'version',
   'projection_version','synthetic','projection_hash','synthetic',
   'target_list_id',CASE c->>'commercial_stage' WHEN 'RESPOSTA' THEN '6ad675af00e712f1799d7693' ELSE '6ad446552feeb154f01a96a0' END);
 receipt:=jsonb_build_object('id','000000000000000000000001','idBoard',c->'board_id','idList',p->>'target_list_id','desc','EVENT_ID='||(c->>'customer_event_id'),'closed',false);
 BEGIN
  PERFORM public.cmc_test_trello_confirm_v1((c->>'customer_event_id')::uuid,gen_random_uuid(),receipt,p);
  RAISE EXCEPTION 'stale lease accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'stale_trello_claim' THEN RAISE;END IF; END;
 BEGIN
  PERFORM public.cmc_test_trello_confirm_v1((c->>'customer_event_id')::uuid,(c->>'claim_token')::uuid,receipt||'{"idBoard":"production"}',p);
  RAISE EXCEPTION 'foreign board accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'invalid_lab_card_receipt' THEN RAISE;END IF; END;
 r:=public.cmc_test_trello_confirm_v1((c->>'customer_event_id')::uuid,(c->>'claim_token')::uuid,receipt,p);
 IF r->>'status'<>'in_sync' THEN RAISE EXCEPTION 'mapping not recorded';END IF;
 IF public.cmc_test_trello_claim_v1() IS NOT NULL THEN RAISE EXCEPTION 'projection no-op failed';END IF;
END $test$;
ROLLBACK;
SELECT 'Trello TEST scope, lease, stale claim, receipt, mapping and no-op: PASS (rollback)' AS result;
