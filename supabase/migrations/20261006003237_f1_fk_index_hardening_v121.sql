-- Click Mais OS Fase 1 / F1.6
-- Cover foreign keys reported by Supabase advisor after v1.2.1 schema migration.

create index if not exists dead_letters_customer_event_idx
  on audit.dead_letters (customer_event_id) where customer_event_id is not null;
create index if not exists decision_runs_input_event_idx
  on audit.decision_runs (input_event_id) where input_event_id is not null;
create index if not exists decision_runs_session_idx
  on audit.decision_runs (session_id) where session_id is not null;

create index if not exists acquisition_touchpoints_session_idx
  on business.acquisition_touchpoints (session_id) where session_id is not null;
create index if not exists art_jobs_source_event_idx
  on business.art_jobs (source_event_id) where source_event_id is not null;
create index if not exists campaign_members_event_idx
  on business.campaign_members (customer_event_id);
create index if not exists contracts_source_event_idx
  on business.contracts (source_event_id) where source_event_id is not null;
create index if not exists customer_events_primary_touchpoint_idx
  on business.customer_events (primary_touchpoint_id) where primary_touchpoint_id is not null;
create index if not exists deliveries_source_event_idx
  on business.deliveries (source_event_id) where source_event_id is not null;
create index if not exists event_facts_supersedes_idx
  on business.event_facts (supersedes_fact_id) where supersedes_fact_id is not null;
create index if not exists event_services_service_idx
  on business.event_services (service_id) where service_id is not null;
create index if not exists followups_campaign_idx
  on business.followups (campaign_id) where campaign_id is not null;
create index if not exists followups_event_idx
  on business.followups (customer_event_id);
create index if not exists human_tasks_event_idx
  on business.human_tasks (customer_event_id) where customer_event_id is not null;
create index if not exists human_tasks_session_idx
  on business.human_tasks (session_id) where session_id is not null;
create index if not exists logistics_source_event_idx
  on business.logistics (source_event_id) where source_event_id is not null;
create index if not exists payments_source_event_idx
  on business.payments (source_event_id) where source_event_id is not null;
create index if not exists quote_items_service_idx
  on business.quote_items (service_id) where service_id is not null;
create index if not exists quotes_locality_idx
  on business.quotes (locality_id) where locality_id is not null;
create index if not exists quotes_presented_message_event_idx
  on business.quotes (presented_message_event_id) where presented_message_event_id is not null;
create index if not exists quotes_pricing_tier_idx
  on business.quotes (pricing_tier_id) where pricing_tier_id is not null;
create index if not exists quotes_supersedes_idx
  on business.quotes (supersedes_quote_id) where supersedes_quote_id is not null;
