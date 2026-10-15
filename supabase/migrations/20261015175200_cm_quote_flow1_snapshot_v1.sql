-- Read-only quote context for WhatsApp Flow 1.
-- This is not an alternative source of truth: canonical facts remain in customer_events/event_facts;
-- core.sessions.context is the current snapshot maintained by cm_quote_flow1_apply_v1.
CREATE OR REPLACE FUNCTION public.cm_quote_flow1_snapshot_v1(p_sender_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_session core.sessions%rowtype;
  v_human_locked boolean;
BEGIN
  IF p_sender_id IS NULL OR p_sender_id !~ '^[0-9]{8,20}$' THEN
    RAISE EXCEPTION 'invalid_whatsapp_sender';
  END IF;
  SELECT * INTO v_session FROM core.sessions
  WHERE external_session_key = 'whatsapp:' || p_sender_id;
  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('found',false,'state','{}'::jsonb,'human_lock',false);
  END IF;
  SELECT EXISTS(SELECT 1 FROM business.human_handoffs
    WHERE active AND (session_id=v_session.id
      OR customer_event_id=v_session.active_customer_event_id))
  INTO v_human_locked;
  RETURN jsonb_build_object('found',true,'state',coalesce(v_session.context,'{}'::jsonb),
     'session_id',v_session.id,'customer_event_id',v_session.active_customer_event_id,
     'state_version',v_session.state_version,'human_lock',v_human_locked);
END
$fn$;
REVOKE ALL ON FUNCTION public.cm_quote_flow1_snapshot_v1(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cm_quote_flow1_snapshot_v1(text) TO service_role;
COMMENT ON FUNCTION public.cm_quote_flow1_snapshot_v1(text)
IS 'Service-role only, read-only Flow 1 context for cumulative interpretation.';
