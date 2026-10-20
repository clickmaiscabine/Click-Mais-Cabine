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
