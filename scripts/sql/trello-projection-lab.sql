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
  desired:=md5('lab-projection-v1.1:'||q.id::text||e.stage_version::text||coalesce(last_at::text,'')||locked::text);
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
