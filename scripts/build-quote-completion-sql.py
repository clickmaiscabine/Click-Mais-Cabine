"""Compose compatible TEST RPC changes from the existing canonical migrations.

No pricing formula is implemented here. The generated SQL is reviewed/applied
as a migration and its actual server version is recorded afterwards.
"""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
def read(p):return (root/p).read_text()
def function(path,name,delimiter):
    text=read(path);start=text.index('CREATE OR REPLACE FUNCTION public.'+name+'(')
    end=text.index(delimiter+';',text.index('AS '+delimiter,start))+len(delimiter)+1
    return text[start:end]
def replace(text,old,new):
    assert old in text,old
    return text.replace(old,new)
old='supabase/migrations/20261019024546_cmc_br002_materialize_existing_human_handoff_lab.sql'
base='supabase/migrations/20261019022018_cmc_br002_quote_persistence_dispatch_guards_lab.sql'
apply=function(old,'cm_quote_flow1_apply_v1','$function$')
apply=replace(apply,"p_sender_id='5511956390586' AND v_event.event_type='empresarial' AND v_event.commercial_stage='ORCAMENTO'","p_sender_id='5511956390586' AND v_event.commercial_stage IN('ORCAMENTO','RESPOSTA')")
apply=replace(apply,"ELSIF v_corporate AND p_evidence->>'_handoff_reason'='HND-EXPLICIT-HUMAN' THEN v_next:='ROUTE_HUMAN';","ELSIF p_sender_id='5511956390586' AND p_evidence->>'_handoff_reason' IN('HND-EXPLICIT-HUMAN','HND-LOCALITY-REVIEW') THEN v_next:='ROUTE_HUMAN';")
apply=replace(apply,"IF v_corporate AND v_next='ROUTE_HUMAN' THEN","IF p_sender_id='5511956390586' AND v_next='ROUTE_HUMAN' THEN")
apply=replace(apply,"CASE WHEN p_evidence->>'_handoff_reason'='HND-EXPLICIT-HUMAN' THEN 'HND-EXPLICIT-HUMAN' ELSE 'HND-SPECIAL-OPERATION' END","CASE WHEN p_evidence->>'_handoff_reason' IN('HND-EXPLICIT-HUMAN','HND-LOCALITY-REVIEW') THEN p_evidence->>'_handoff_reason' ELSE 'HND-SPECIAL-OPERATION' END")
date_confirmation="""
  -- A narrow social-only state transition after the agenda lookup. It never
  -- changes reservations; "redo" clears only the event date.
  IF p_extracted ? 'social_date_action' THEN
    IF NOT (p_sender_id='5511956390586' AND NOT v_corporate
            AND coalesce(v_context->>'pending_question','')='social_date_confirmation') THEN
      RAISE EXCEPTION 'social_date_action_not_expected';
    END IF;
    IF p_extracted->>'social_date_action'='redo' THEN
      v_facts := v_facts - 'event_date' - 'event_date_partial';
      v_pending := v_pending - 'event_date' - 'event_date_partial';
      v_changed_keys := array_append(v_changed_keys,'event_date');
      UPDATE business.customer_events SET event_date=NULL, updated_at=now()
      WHERE id=v_event.id;
      INSERT INTO core.events(session_id,customer_event_id,event_type,direction,source,idempotency_key,payload)
      VALUES(v_session.id,v_event.id,'social_date_reentry_requested','internal','flow1',
        'social:date-redo:'||v_inbound,jsonb_build_object('input_event_id',v_inbound))
      ON CONFLICT(idempotency_key) DO NOTHING;
    ELSIF p_extracted->>'social_date_action'<>'confirm' THEN
      RAISE EXCEPTION 'invalid_social_date_action';
    END IF;
  END IF;
"""
apply=replace(apply,"  -- Only agreed fields are admitted. Any proposed replacement becomes a\n  -- pending conflict until a subsequent message explicitly confirms a value.",date_confirmation+"\n  -- Only agreed fields are admitted. Any proposed replacement becomes a\n  -- pending conflict until a subsequent message explicitly confirms a value.")
apply=replace(apply,"'event_dates','data_inicio','data_fim','purpose_ambiguous','locality_ambiguous') THEN","'event_dates','data_inicio','data_fim','purpose_ambiguous','locality_ambiguous','social_date_action') THEN")
apply=replace(apply,"    IF v_val IS NULL OR v_val = 'null'::jsonb OR v_val = '\"\"'::jsonb OR v_val = '[]'::jsonb THEN\n      CONTINUE;\n    END IF;","    IF v_val IS NULL OR v_val = 'null'::jsonb OR v_val = '\"\"'::jsonb OR v_val = '[]'::jsonb THEN\n      CONTINUE;\n    END IF;\n    IF v_key='social_date_action' THEN CONTINUE; END IF;")
apply=replace(apply,"      WHEN 'FLOW_4_LOCALITY' THEN 'event_location'","      WHEN 'FLOW_4_LOCALITY' THEN CASE WHEN NOT v_corporate AND 'event_date'=ANY(v_changed_keys) THEN 'social_date_confirmation' ELSE 'event_location' END")
post="""
  -- A genuine reply after presentation is state, not a duplicate quotation.
  -- Scope is the existing TEST contact; production routing is unchanged.
  IF p_sender_id='5511956390586' AND p_evidence->>'_transport'='meta_webhook'
     AND v_event.commercial_stage IN('ORCAMENTO','RESPOSTA')
     AND coalesce(array_length(v_changed_keys,1),0)=0 AND v_pending='{}'::jsonb
     AND v_next='FLOW_5_READY' AND NOT v_human_locked THEN
    IF v_event.commercial_stage='ORCAMENTO' THEN
      PERFORM business.transition_customer_event(v_event.id,v_event.stage_version,'RESPOSTA','system','meta_test_reply','CUSTOMER_RESPONDED',v_inbound,'{}');
    END IF;
    UPDATE business.customer_events SET metadata=metadata||jsonb_build_object('lab_next_action','Revisar resposta do cliente e continuar atendimento','lab_last_response_event',v_inbound),updated_at=now() WHERE id=v_event.id;
    v_next:='POST_QUOTE_RESPONSE';
  END IF;
"""
apply=replace(apply,"  v_context := v_context || jsonb_build_object(",post+"\n  v_context := v_context || jsonb_build_object(")
ctx=function(base,'cmc_test_quote_context_v1','$fn$')
ctx=replace(ctx,"IF f->>'purpose'<>'empresarial' OR", "IF f->>'purpose' IS NULL OR")
ctx=replace(ctx,"'facts',jsonb_build_object('event_type','empresarial'", "'facts',jsonb_build_object('event_type',f->>'purpose'")
ctx=replace(ctx,"'event_date',f->'data_inicio','data_inicio',f->'data_inicio','data_fim',f->'data_fim','event_dates',f->'event_dates','dias_evento',f->'dias_evento','periodos_por_dia',f->'periodos_por_dia'),", "'event_date',f->'event_date') || CASE WHEN f->>'purpose'='empresarial' THEN jsonb_build_object('data_inicio',f->'data_inicio','data_fim',f->'data_fim','event_dates',f->'event_dates','dias_evento',f->'dias_evento','periodos_por_dia',f->'periodos_por_dia') ELSE '{}'::jsonb END,")
ctx=replace(ctx,"'event_dates',f->'event_dates',", "'event_dates',CASE WHEN f->>'purpose'='empresarial' THEN f->'event_dates' ELSE jsonb_build_array(f->>'event_date') END,")
ctx=replace(ctx,"'quantity',1)", "'quantity',1,'fixedPix',v.details_json->'fixedPix')")
ctx=replace(ctx,"'services',(SELECT", "'rule_set',CASE WHEN f->>'purpose'='empresarial' THEN NULL ELSE public.cmc_test_social_rule_set_v1() END,\n  'services',(SELECT")
ctx=replace(ctx,"jsonb_array_elements_text(f->'event_dates')", "jsonb_array_elements_text(CASE WHEN f->>'purpose'='empresarial' THEN f->'event_dates' ELSE jsonb_build_array(f->>'event_date') END)")
rules="""CREATE OR REPLACE FUNCTION public.cmc_test_social_rule_set_v1()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE r jsonb; versions integer;
BEGIN
 IF EXISTS(SELECT k FROM unnest(ARRAY['card_surcharge_rate','card_round_up','combo_second_main_discount']) k
   WHERE (SELECT count(*) FROM catalog.commercial_rules c WHERE c.rule_key=k AND (c.active_from IS NULL OR c.active_from<=now()) AND (c.active_to IS NULL OR c.active_to>now()))<>1) THEN
   RAISE EXCEPTION 'social_rule_set_not_unique';END IF;
 SELECT jsonb_object_agg(rule_key,rule_value),count(DISTINCT rule_version) INTO r,versions FROM catalog.commercial_rules
 WHERE (active_from IS NULL OR active_from<=now()) AND (active_to IS NULL OR active_to>now());
 IF versions<>1 THEN RAISE EXCEPTION 'social_rule_version_conflict';END IF;
 RETURN jsonb_build_object('version',(SELECT min(rule_version) FROM catalog.commercial_rules WHERE (active_from IS NULL OR active_from<=now()) AND (active_to IS NULL OR active_to>now())),
 'cardSurchargeRate',r->'card_surcharge_rate'->'rate','cardRoundUpMultiple',r->'card_round_up'->'multiple',
 'comboSecondMainDiscountRate',r->'combo_second_main_discount'->'discount_rate');
END $fn$;
REVOKE ALL ON FUNCTION public.cmc_test_social_rule_set_v1() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cmc_test_social_rule_set_v1() TO service_role;
"""
enq=function(old,'cmc_test_enqueue_corporate_v1','$fn$')
enq=replace(enq,"IF s.context->'facts'->>'purpose'<>'empresarial' THEN RAISE EXCEPTION 'not_corporate';END IF;", "-- Both routes are admitted only for the existing authorized TEST session.")
enq=replace(enq,"OR p_quote_result->>'pricingRuleVersion'<>'BR-002@1.0'\n    OR p_quote_result->'corporate' IS NULL", "OR (s.context->'facts'->>'purpose'='empresarial' AND (p_quote_result->>'pricingRuleVersion' IS DISTINCT FROM 'BR-002@1.0' OR p_quote_result->'corporate' IS NULL))\n    OR (s.context->'facts'->>'purpose'<>'empresarial' AND (p_quote_result->'corporate' IS NOT NULL OR p_quote_result->>'pricingRuleVersion' IS DISTINCT FROM (public.cmc_test_social_rule_set_v1()->>'version')))")
enq=replace(enq,"(p_quote_result->'corporate')::text", "coalesce((p_quote_result->'corporate')::text,(p_quote_result->'totals')::text)")
enq=replace(enq,"payload->>'kind'='corporate_quote'", "payload->>'kind' IN('corporate_quote','social_quote','social_media')")
enq=replace(enq,"'BR-002@1.0',(p_quote_result", "p_quote_result->>'pricingRuleVersion',(p_quote_result")
enq=replace(enq,"(s.context->'facts'->>'data_inicio')::date", "coalesce(s.context->'facts'->>'data_inicio',s.context->'facts'->>'event_date')::date")
enq=replace(enq,"THEN 'corporate_quote' ELSE 'qualification'", "THEN CASE WHEN s.context->'facts'->>'purpose'='empresarial' THEN 'corporate_quote' ELSE 'social_quote' END ELSE 'qualification'")
claim=function('supabase/migrations/20261019022334_cmc_br002_transport_compatibility_queue_facts_guard.sql','cmc_test_claim_outbound','$fn$')
claim=replace(claim,"q.payload->>'kind'='corporate_quote'", "q.payload->>'kind' IN('corporate_quote','social_quote','social_media')")
mark=function(base,'cmc_test_mark_outbound_sent','$fn$')
mark=replace(mark,"q.payload->>'kind'='corporate_quote'", "q.payload->>'kind' IN('corporate_quote','social_quote')")
# Existing special sequence waits are historical; current quote question/quote
# sequencing uses a short transport pacing, not a commercial delay.
mark=replace(mark,"ELSE interval '2 minutes'", "ELSE interval '2 seconds'")
parts=['-- Compatible LAB-only consolidation; no pricing changes.',rules,ctx,apply,enq,claim,mark]
for sig in ['cm_quote_flow1_apply_v1(text,text,jsonb,jsonb,text,text,timestamptz)','cmc_test_quote_context_v1(uuid,uuid,uuid)','cmc_test_enqueue_corporate_v1(uuid,uuid,uuid,jsonb,jsonb)','cmc_test_claim_outbound()','cmc_test_mark_outbound_sent(uuid,text)']:
 parts.append(f'REVOKE ALL ON FUNCTION public.{sig} FROM PUBLIC,anon,authenticated;\nGRANT EXECUTE ON FUNCTION public.{sig} TO service_role;')
out=root/'scripts/sql/quote-completion-lab.sql';out.parent.mkdir(exist_ok=True)
out.write_text('\n\n'.join(parts)+'\n')
print(out.relative_to(root))
