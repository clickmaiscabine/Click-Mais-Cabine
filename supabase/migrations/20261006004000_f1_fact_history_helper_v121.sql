-- Click Mais OS Fase 1 / F1.5
-- Canonical helper compatibility for append-only EventFact history.

create or replace function business.record_event_fact(
  p_customer_event_id uuid,
  p_fact_key text,
  p_fact_value jsonb,
  p_fact_status text,
  p_source_type text,
  p_source_event_id uuid default null,
  p_source_ref text default null,
  p_confidence numeric default null,
  p_actor_ref text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns business.event_facts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_previous business.event_facts;
  v_new business.event_facts;
  v_now timestamptz := now();
begin
  if p_fact_key is null or btrim(p_fact_key) = '' then
    raise exception 'fact_key_required';
  end if;

  select *
    into v_previous
    from business.event_facts
   where customer_event_id = p_customer_event_id
     and fact_key = p_fact_key
     and is_current
   for update;

  if v_previous.id is not null then
    update business.event_facts
       set is_current = false,
           valid_to = coalesce(valid_to, v_now)
     where id = v_previous.id;
  end if;

  insert into business.event_facts (
    customer_event_id, fact_key, fact_value, fact_status, source_type,
    source_event_id, source_ref, confidence, supersedes_fact_id,
    actor_ref, metadata, valid_from, valid_to, is_current
  )
  values (
    p_customer_event_id, p_fact_key, p_fact_value, p_fact_status, p_source_type,
    p_source_event_id, p_source_ref, p_confidence, v_previous.id,
    p_actor_ref, coalesce(p_metadata, '{}'::jsonb), v_now, null, true
  )
  returning * into v_new;

  return v_new;
end;
$$;

revoke execute on function business.record_event_fact(uuid,text,jsonb,text,text,uuid,text,numeric,text,jsonb)
from public, anon, authenticated;
grant execute on function business.record_event_fact(uuid,text,jsonb,text,text,uuid,text,numeric,text,jsonb)
to service_role;

comment on function business.record_event_fact(uuid,text,jsonb,text,text,uuid,text,numeric,text,jsonb)
is 'Append-only canonical fact writer: supersedes prior current fact, closes valid_to and preserves provenance.';
