-- LAB projection uses existing business metadata + integrations.trello_projections.
-- No new queue/table/database. Pending work is derived from confirmed quotes.
CREATE OR REPLACE FUNCTION public.cmc_test_trello_claim_v1()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE e business.customer_events%rowtype; q business.quotes%rowtype; s core.sessions%rowtype;
 p integrations.trello_projections%rowtype; desired text; lease uuid; locked boolean; last_at timestamptz;
BEGIN
 FOR e IN SELECT ev.* FROM business.customer_events ev JOIN business.contacts c ON c.id=ev.contact_id
  WHERE c.whatsapp_id='5511956390586' AND ev.status='active' AND ev.operational_stage='NOT_STARTED'
   AND ev.qualified_at IS NOT NULL AND ev.commercial_stage IN('ORCAMENTO','RESPOSTA')
   AND EXISTS(SELECT 1 FROM core.sessions x WHERE x.active_customer_event_id=ev.id AND x.status='active')
   AND coalesce((ev.metadata->'trello_lab_claim'->>'until')::timestamptz,'epoch')<now()
  ORDER BY ev.updated_at FOR UPDATE OF ev SKIP LOCKED LIMIT 5 LOOP
  SELECT * INTO s FROM core.sessions WHERE active_customer_event_id=e.id AND status='active' LIMIT 1;
  SELECT * INTO q FROM business.quotes b WHERE b.customer_event_id=e.id AND b.status='presented'
    AND b.presented_message_event_id IS NOT NULL
    AND EXISTS(SELECT 1 FROM public.cmc_test_outbound_queue o WHERE o.customer_event_id=e.id AND o.status='sent' AND o.meta_message_id IS NOT NULL AND o.payload->>'quote_id'=b.id::text)
    ORDER BY b.quote_version DESC LIMIT 1;
  IF q.id IS NULL THEN CONTINUE;END IF;
  locked:=EXISTS(SELECT 1 FROM business.human_handoffs h WHERE h.active AND(h.customer_event_id=e.id OR h.session_id=s.id));
  SELECT max(occurred_at) INTO last_at FROM core.events WHERE customer_event_id=e.id AND direction='inbound' AND source='meta_whatsapp';
  desired:=md5(q.id::text||e.stage_version::text||coalesce(last_at::text,'')||locked::text);
  SELECT * INTO p FROM integrations.trello_projections WHERE customer_event_id=e.id AND projection_type='commercial';
  IF p.metadata->>'desired_hash'=desired AND p.drift_status='in_sync' THEN CONTINUE;END IF;
  IF e.metadata->'trello_lab_claim'->>'desired_hash'=desired AND coalesce((e.metadata->'trello_lab_claim'->>'attempts')::int,0)>=3 THEN CONTINUE;END IF;
  lease:=gen_random_uuid();
  UPDATE business.customer_events SET metadata=metadata||jsonb_build_object('trello_lab_claim',jsonb_build_object('attempts',CASE WHEN e.metadata->'trello_lab_claim'->>'desired_hash'=desired THEN coalesce((e.metadata->'trello_lab_claim'->>'attempts')::int,0)+1 ELSE 1 END,'token',lease,'until',now()+interval '2 minutes','desired_hash',desired)) WHERE id=e.id;
  RETURN jsonb_build_object('lab_scope',true,'board_id','6ad446503b529e753ac4b878','claim_token',lease,'desired_hash',desired,
   'session_id',s.id,'customer_event_id',e.id,'commercial_stage',e.commercial_stage,'stage_version',e.stage_version,'qualified_at',e.qualified_at,
   'source_event_type','quote_sent','event_type',e.event_type,'event_date',e.event_date,'city',e.city,
   'customer_name','TEST LAB','origin_summary','Meta TEST','last_interaction_at',last_at,
   'next_action_at',NULL,'next_action',coalesce(e.metadata->>'lab_next_action','Aguardar resposta do cliente'),
   'human_lock',locked,'services',(SELECT jsonb_agg(v.official_name ORDER BY v.code) FROM business.event_services es JOIN catalog.services v ON v.code=CASE WHEN es.service_code='fotografo' THEN 'fotografo_evento' ELSE es.service_code END WHERE es.customer_event_id=e.id AND es.status<>'cancelled'),
   'quote',jsonb_build_object('id',q.id,'status',q.status,'version',q.quote_version,'pix',q.total_pix,'card',q.total_card,
      'corporate',q.pricing_snapshot->'quote_result'->'corporate'),
   'existing_projection',CASE WHEN p.id IS NOT NULL THEN jsonb_build_object('card_id',p.card_id,'list_id',p.list_id,'projection_version',p.metadata->>'planner_version','projection_hash',p.metadata->>'projection_hash') ELSE NULL END);
 END LOOP;
 RETURN NULL;
END $fn$;

CREATE OR REPLACE FUNCTION public.cmc_test_trello_confirm_v1(p_customer_event_id uuid,p_claim_token uuid,p_card jsonb,p_projection jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE e business.customer_events%rowtype; intent jsonb; stage_list text;
BEGIN
 SELECT ev.* INTO e FROM business.customer_events ev JOIN business.contacts c ON c.id=ev.contact_id
 WHERE ev.id=p_customer_event_id AND c.whatsapp_id='5511956390586' AND ev.status='active' FOR UPDATE OF ev;
 IF e.id IS NULL THEN RAISE EXCEPTION 'not_authorized_test_event';END IF;
 intent:=e.metadata->'trello_lab_claim';
 IF intent->>'token' IS DISTINCT FROM p_claim_token::text THEN RAISE EXCEPTION 'stale_trello_claim';END IF;
 IF (p_projection->>'stage_version')::bigint<>e.stage_version THEN RAISE EXCEPTION 'stale_trello_stage';END IF;
 IF NOT EXISTS(SELECT 1 FROM business.quotes WHERE id=(p_projection->>'quote_id')::uuid AND customer_event_id=e.id AND status='presented' AND quote_version=(p_projection->>'quote_version')::int) THEN RAISE EXCEPTION 'stale_trello_quote';END IF;
 stage_list:=CASE e.commercial_stage WHEN 'ORCAMENTO' THEN '6ad446552feeb154f01a96a0' WHEN 'RESPOSTA' THEN '6ad675af00e712f1799d7693' END;
 IF stage_list IS NULL OR p_projection->>'target_list_id' IS DISTINCT FROM stage_list THEN RAISE EXCEPTION 'invalid_lab_stage_list';END IF;
 IF p_card->>'idBoard' IS DISTINCT FROM '6ad446503b529e753ac4b878' OR p_card->>'id' IS NULL OR p_card->>'id' !~ '^[0-9a-f]{24}$'
   OR p_card->>'idList' IS DISTINCT FROM p_projection->>'target_list_id' OR coalesce((p_card->>'closed')::boolean,false) THEN RAISE EXCEPTION 'invalid_lab_card_receipt';END IF;
 IF coalesce(position('EVENT_ID='||e.id::text in p_card->>'desc'),0)=0 THEN RAISE EXCEPTION 'card_event_mismatch';END IF;
 INSERT INTO integrations.trello_projections(customer_event_id,projection_type,board_id,card_id,list_id,canonical_stage,projection_version,last_synced_at,drift_status,metadata)
 VALUES(e.id,'commercial','6ad446503b529e753ac4b878',p_card->>'id',p_card->>'idList',e.commercial_stage,e.stage_version,now(),'in_sync',
  jsonb_build_object('environment','Meta TEST','desired_hash',intent->>'desired_hash','projection_hash',p_projection->>'projection_hash','planner_version',p_projection->>'projection_version','quote_version',p_projection->'quote_version'))
 ON CONFLICT(customer_event_id,projection_type) DO UPDATE SET board_id=excluded.board_id,card_id=excluded.card_id,list_id=excluded.list_id,canonical_stage=excluded.canonical_stage,projection_version=excluded.projection_version,last_synced_at=now(),drift_status='in_sync',metadata=excluded.metadata,updated_at=now();
 UPDATE business.customer_events SET metadata=metadata-'trello_lab_claim' WHERE id=e.id;
 INSERT INTO core.events(session_id,customer_event_id,event_type,direction,source,idempotency_key,payload)
 VALUES((SELECT id FROM core.sessions WHERE active_customer_event_id=e.id AND status='active' LIMIT 1),e.id,'trello_projection_synced','internal','trello_lab','trello:lab:'||e.id||':'||(intent->>'desired_hash'),jsonb_build_object('card_id',p_card->>'id','projection_hash',p_projection->>'projection_hash','stage',e.commercial_stage)) ON CONFLICT(idempotency_key) DO NOTHING;
 RETURN jsonb_build_object('status','in_sync','customer_event_id',e.id,'card_id',p_card->>'id');
END $fn$;
REVOKE ALL ON FUNCTION public.cmc_test_trello_claim_v1() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.cmc_test_trello_confirm_v1(uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cmc_test_trello_claim_v1(),public.cmc_test_trello_confirm_v1(uuid,uuid,jsonb,jsonb) TO service_role;

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
 -- Both routes are admitted only for the existing authorized TEST session.
 IF EXISTS(SELECT 1 FROM business.human_handoffs h WHERE h.active AND(h.session_id=s.id OR h.customer_event_id=p_customer_event_id)) THEN RETURN jsonb_build_object('enqueued',false,'reason','HUMAN_LOCK_ACTIVE');END IF;
 SELECT * INTO incoming FROM core.events WHERE id=p_input_event_id AND session_id=s.id AND customer_event_id=p_customer_event_id;
 IF incoming.id IS NULL OR incoming.idempotency_key NOT IN ('meta:'||(s.context->>'last_message_id'),'lab:'||(s.context->>'last_message_id')) THEN RETURN jsonb_build_object('enqueued',false,'reason','STALE_INPUT_EVENT');END IF;

 IF p_message->>'handoff_reason' IN('HND-PRICE-NOT-AUTHORIZED','HND-LOCALITY-NOT-FOUND','HND-LOCALITY-REVIEW','HND-SPECIAL-OPERATION','HND-KNOWLEDGE-GAP') THEN
  INSERT INTO business.human_handoffs(customer_event_id,session_id,reason_code,source,metadata)
  VALUES(p_customer_event_id,s.id,p_message->>'handoff_reason','quote_engine_br002_lab',
    jsonb_build_object('facts',s.context->'facts','input_event_id',incoming.id,'blockers',p_message->'blockers')) ON CONFLICT DO NOTHING;
  INSERT INTO core.events(session_id,customer_event_id,event_type,direction,source,idempotency_key,payload)
  VALUES(s.id,p_customer_event_id,'human_handoff_requested','internal','quote_engine','br002:human:'||incoming.id,
    jsonb_build_object('reason_code',p_message->>'handoff_reason','input_event_id',incoming.id)) ON CONFLICT(idempotency_key) DO NOTHING;
  UPDATE core.sessions SET current_state='HUMAN_LOCK_NO_REPLY',context=context||'{"last_flow":"HUMAN_LOCK_NO_REPLY","pending_question":null}'::jsonb,state_version=state_version+1,updated_at=now() WHERE id=s.id;
  UPDATE public.cmc_test_outbound_queue SET status='cancelled',last_error='HUMAN_HANDOFF_ACTIVE',updated_at=now() WHERE customer_event_id=p_customer_event_id AND status IN('pending','failed');
  RETURN jsonb_build_object('enqueued',false,'reason','HUMAN_HANDOFF_CREATED');
 END IF;
 txt:=p_message->>'text'; is_quote:=p_quote_result IS NOT NULL;
 IF txt IS NULL OR length(txt) NOT BETWEEN 1 AND 4096 OR position(chr(92)||'n' in txt)>0 THEN RAISE EXCEPTION 'invalid_message_format';END IF;
 IF is_quote THEN
  IF s.current_state<>'FLOW_5_READY' OR p_quote_result->>'status'<>'ready' OR (s.context->'facts'->>'purpose'='empresarial' AND (p_quote_result->>'pricingRuleVersion' IS DISTINCT FROM 'BR-002@1.0' OR p_quote_result->'corporate' IS NULL))
    OR (s.context->'facts'->>'purpose'<>'empresarial' AND (p_quote_result->'corporate' IS NOT NULL OR p_quote_result->>'pricingRuleVersion' IS DISTINCT FROM (public.cmc_test_social_rule_set_v1()->>'version'))) OR coalesce(s.context->'pending_conflicts','{}'::jsonb)<>'{}'::jsonb THEN RAISE EXCEPTION 'quote_not_ready';END IF;
  IF p_quote_result->'availability'->>'status' IS DISTINCT FROM 'preliminary_available' AND position('Gostaria de seguir com a tentativa de reserva' in txt)>0 THEN RAISE EXCEPTION 'booking_invitation_blocked';END IF;
  IF (p_quote_result->'customerVisible'->>'pix')::numeric<=0 OR (p_quote_result->'customerVisible'->>'card')::numeric<=0 THEN RAISE EXCEPTION 'invalid_quote_amount';END IF;
  fp:=md5((s.context->'facts')::text||coalesce((p_quote_result->'corporate')::text,(p_quote_result->'totals')::text)||(p_quote_result->'pricing_source'->>'revision_id')||coalesce(p_quote_result->'availability'->>'status','unknown')||coalesce((p_quote_result->'availability'->'dates')::text,'[]'));
  SELECT * INTO q FROM business.quotes WHERE customer_event_id=p_customer_event_id AND fingerprint=fp;
  IF q.id IS NULL THEN
    UPDATE business.quotes SET status='superseded' WHERE customer_event_id=p_customer_event_id AND status IN('ready','presented');
    UPDATE public.cmc_test_outbound_queue SET status='cancelled',last_error='QUOTE_SUPERSEDED',updated_at=now()
       WHERE customer_event_id=p_customer_event_id AND payload->>'kind' IN('corporate_quote','social_quote','social_media') AND status IN('pending','failed');
    SELECT coalesce(max(quote_version),0)+1 INTO event_version FROM business.quotes WHERE customer_event_id=p_customer_event_id;
    INSERT INTO business.quotes(customer_event_id,quote_version,status,total_pix,total_card,pricing_source,pricing_snapshot,rule_set_version,locality_id,pricing_tier_id,event_date_snapshot,fingerprint)
    VALUES(p_customer_event_id,event_version,'ready',(p_quote_result->'customerVisible'->>'pix')::numeric,(p_quote_result->'customerVisible'->>'card')::numeric,
      p_quote_result->'pricing_source'->>'url',jsonb_build_object('quote_result',p_quote_result,'message_text',txt,'environment','Meta TEST','input_source',incoming.source),
      p_quote_result->>'pricingRuleVersion',(p_quote_result->'pricing_source'->>'locality_id')::uuid,(p_quote_result->'pricing_source'->>'tier_id')::uuid,
      coalesce(s.context->'facts'->>'data_inicio',s.context->'facts'->>'event_date')::date,fp) RETURNING * INTO q;
    INSERT INTO core.events(session_id,customer_event_id,event_type,direction,source,idempotency_key,payload)
      VALUES(s.id,p_customer_event_id,'quote_generated','internal','quote_engine','br002:generated:'||q.id,jsonb_build_object('quote_id',q.id,'rule',p_quote_result->>'pricingRuleVersion','input_event_id',incoming.id)) ON CONFLICT(idempotency_key) DO NOTHING;
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
 VALUES(key,phone,meta_phone,p_customer_event_id,s.id,seq,'text',jsonb_build_object('text',txt,'kind',CASE WHEN is_quote THEN CASE WHEN s.context->'facts'->>'purpose'='empresarial' THEN 'corporate_quote' ELSE 'social_quote' END ELSE 'qualification' END,
   'quote_id',q.id,'input_event_id',incoming.id,'state_version',s.state_version,'facts_hash',md5((s.context->'facts')::text)),now(),'pending') ON CONFLICT(idempotency_key) DO NOTHING RETURNING id INTO queue_id;
 RETURN jsonb_build_object('enqueued',queue_id IS NOT NULL,'duplicate',queue_id IS NULL,'queue_id',queue_id,'quote_id',q.id);
END $fn$;
