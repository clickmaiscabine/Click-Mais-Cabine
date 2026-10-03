-- Applied to Supabase project "Chatbot Clique Mais"
-- Version: 20261003050907
-- Name: expand_click_mais_os_business_state_v1
-- Purpose: expand the minimal Event State Engine with Click Mais business domains
-- and a non-secret integration readiness registry.

create schema if not exists business;
create schema if not exists integrations;

revoke all on schema business from public, anon, authenticated;
revoke all on schema integrations from public, anon, authenticated;

grant usage on schema business to service_role;
grant usage on schema integrations to service_role;

create table business.contacts (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text unique,
  whatsapp_id text unique,
  display_name text,
  relationship_type text not null default 'unknown'
    check (relationship_type in ('unknown','lead','customer','vendor','venue','staff','personal','other')),
  chatwoot_contact_id text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table business.customer_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references business.contacts(id) on delete restrict,
  external_event_key text unique,
  event_type text,
  event_date date,
  event_start_time time,
  city text,
  district text,
  venue_name text,
  venue_address text,
  lifecycle_stage text not null default 'lead_new'
    check (lifecycle_stage in (
      'lead_new','lead_qualifying','quote_presented','awaiting_decision',
      'negotiation_human','contracting','contracted_pre_event','event_day',
      'post_event','completed','lost','cancelled'
    )),
  stage_version bigint not null default 0 check (stage_version >= 0),
  status text not null default 'active'
    check (status in ('active','paused','closed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_events_contact_date_idx
  on business.customer_events (contact_id, event_date desc nulls last);
create index customer_events_stage_idx
  on business.customer_events (lifecycle_stage, status);

create table business.event_services (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete cascade,
  service_code text not null,
  status text not null default 'interested'
    check (status in ('interested','quoted','contracted','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_event_id, service_code)
);

create index event_services_event_idx
  on business.event_services (customer_event_id);

create table business.event_facts (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete cascade,
  fact_key text not null,
  fact_value jsonb not null,
  fact_status text not null
    check (fact_status in ('known','derived','verified','conflict')),
  source_type text not null
    check (source_type in ('customer','human','rule','calculation','integration','migration','agent')),
  source_event_id uuid references core.events(id) on delete set null,
  source_ref text,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  supersedes_fact_id uuid references business.event_facts(id) on delete set null,
  is_current boolean not null default true,
  actor_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index event_facts_one_current_idx
  on business.event_facts (customer_event_id, fact_key)
  where is_current;
create index event_facts_history_idx
  on business.event_facts (customer_event_id, fact_key, created_at desc);
create index event_facts_source_event_idx
  on business.event_facts (source_event_id)
  where source_event_id is not null;

create table business.module_states (
  customer_event_id uuid not null references business.customer_events(id) on delete cascade,
  module_code text not null,
  status text not null default 'pending'
    check (status in ('pending','in_progress','blocked','ready','completed','not_applicable')),
  completion_percent smallint not null default 0
    check (completion_percent between 0 and 100),
  ready boolean not null default false,
  blockers jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (customer_event_id, module_code)
);

create table business.quotes (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete restrict,
  quote_version integer not null check (quote_version > 0),
  status text not null default 'draft'
    check (status in ('draft','presented','accepted','rejected','expired','superseded')),
  currency text not null default 'BRL',
  total_pix numeric(12,2),
  total_card numeric(12,2),
  pricing_source text not null,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  supersedes_quote_id uuid references business.quotes(id) on delete set null,
  presented_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (customer_event_id, quote_version)
);

create index quotes_event_status_idx
  on business.quotes (customer_event_id, status, created_at desc);

create table business.contracts (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete restrict,
  contract_version integer not null default 1 check (contract_version > 0),
  provider text not null default 'autentique',
  external_document_id text,
  document_ref text,
  status text not null default 'not_started'
    check (status in ('not_started','preparing','sent','signed','cancelled','superseded')),
  sent_at timestamptz,
  signed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_event_id, contract_version)
);

create index contracts_event_status_idx
  on business.contracts (customer_event_id, status);

create table business.payments (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete restrict,
  contract_id uuid references business.contracts(id) on delete set null,
  payment_kind text not null
    check (payment_kind in ('signal','final','full','other')),
  expected_amount numeric(12,2),
  extracted_amount numeric(12,2),
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending','apparent_ok','divergent','unreadable')),
  human_status text not null default 'pending'
    check (human_status in ('pending','verified','rejected')),
  proof_ref text,
  verified_by text,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_event_status_idx
  on business.payments (customer_event_id, human_status, created_at desc);
create index payments_contract_idx
  on business.payments (contract_id)
  where contract_id is not null;

create table business.art_jobs (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete restrict,
  layout_id text,
  status text not null default 'not_started'
    check (status in (
      'not_started','awaiting_briefing','generating','awaiting_customer',
      'pre_approved','human_revision','final','cancelled'
    )),
  briefing_payload jsonb not null default '{}'::jsonb,
  draft_ref text,
  final_ref text,
  customer_decision text
    check (customer_decision is null or customer_decision in ('approved','change_requested','question','undefined')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index art_jobs_event_status_idx
  on business.art_jobs (customer_event_id, status);

create table business.logistics (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null unique references business.customer_events(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending','preparing','blocked','ready','changed','completed')),
  checklist jsonb not null default '{}'::jsonb,
  checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table business.deliveries (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete restrict,
  provider text not null default 'onedrive',
  delivery_kind text not null default 'original_media',
  folder_ref text,
  share_url text,
  status text not null default 'pending'
    check (status in ('pending','ready','sent','confirmed','problem','cancelled')),
  sent_at timestamptz,
  confirmed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_event_id, provider, delivery_kind)
);

create index deliveries_status_idx
  on business.deliveries (status, created_at);

create table business.publication_consents (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete cascade,
  channel text not null,
  consent boolean not null,
  source_type text not null default 'human'
    check (source_type in ('customer','human','contract','integration')),
  source_ref text,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (customer_event_id, channel)
);

create table business.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft'
    check (status in ('draft','approved','running','finished','cancelled')),
  segment_rules jsonb not null default '{}'::jsonb,
  offer_rules jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  approved_by text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table business.followups (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete cascade,
  campaign_id uuid references business.campaigns(id) on delete set null,
  followup_kind text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','sent','cancelled','skipped','failed')),
  reason_code text,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index followups_due_idx
  on business.followups (status, scheduled_for)
  where status = 'pending';

create table business.human_handoffs (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid references business.customer_events(id) on delete cascade,
  session_id uuid references core.sessions(id) on delete set null,
  active boolean not null default true,
  reason_code text not null,
  owner_ref text,
  source text not null default 'system',
  acquired_at timestamptz not null default now(),
  released_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create unique index human_handoffs_one_active_event_idx
  on business.human_handoffs (customer_event_id)
  where active and customer_event_id is not null;
create unique index human_handoffs_one_active_session_idx
  on business.human_handoffs (session_id)
  where active and session_id is not null;

create table integrations.registry (
  platform_key text primary key,
  display_name text not null,
  role text not null,
  status text not null
    check (status in ('active','standby','pending_credentials','planned','disabled','deprecated')),
  credential_state text not null default 'not_required'
    check (credential_state in ('not_required','pending','vaulted')),
  runtime_enabled boolean not null default false,
  canonical boolean not null default false,
  external_account_ref text,
  notes text,
  last_verified_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into integrations.registry
(platform_key, display_name, role, status, credential_state, runtime_enabled, canonical, notes, last_verified_at)
values
('meta_whatsapp','Meta WhatsApp Business Platform','Official WhatsApp transport and test/production numbers','pending_credentials','pending',false,true,'Clean business identity pending. Use Meta test number first; production number only after homologation and Coexistence validation.',now()),
('chatwoot','Chatwoot Cloud','Human inbox, CRM view, handoff and conversation operations','pending_credentials','pending',false,true,'Onboarding pending institutional email. Keep integration adapter in standby until credentials are available.',now()),
('supabase','Supabase','Operational state, Event State Engine and audit','active','vaulted',true,true,'Project Chatbot Clique Mais.',now()),
('n8n','n8n self-hosted','Workflow orchestration and execution','active','vaulted',true,true,'Runs self-hosted on Hostinger VPS.',now()),
('hostinger','Hostinger VPS','Runtime hosting for n8n and supporting services','active','vaulted',true,true,'Infrastructure access is vaulted.',now()),
('github','GitHub','Canonical versioned project source','active','vaulted',true,true,'Repository clickmaiscabine/Click-Mais-Cabine.',now()),
('openai','OpenAI Platform','LLM composition, agent tooling and approved model calls','active','vaulted',true,true,'Secrets remain outside repository.',now()),
('google_drive','Google Drive','Working artifacts, references and operational files','active','vaulted',true,false,'Support storage; not the canonical customer media delivery channel.',now()),
('google_calendar','Google Calendar','Availability and scheduling support','active','vaulted',true,false,'Availability is distinct from reservation.',now()),
('trello','Trello','Human operational projection and tasks','active','vaulted',true,false,'Trello is not the state source of truth.',now()),
('autentique','Autentique','Contract signature workflow','active','vaulted',true,false,'Contract status is mirrored into Supabase.',now()),
('onedrive','Microsoft OneDrive','Canonical post-event media storage and client delivery','active','vaulted',true,true,'All event media folders remain canonical in OneDrive; customer receives the event-folder link after the event.',now()),
('facebook_publication','Facebook publication','Optional post-event publication after consent','standby','vaulted',false,false,'Publication is separate from OneDrive delivery and must be consent-gated; may be executed by an authorized Hermes/Codex skill.',now())
on conflict (platform_key) do update
set display_name = excluded.display_name,
    role = excluded.role,
    status = excluded.status,
    credential_state = excluded.credential_state,
    runtime_enabled = excluded.runtime_enabled,
    canonical = excluded.canonical,
    notes = excluded.notes,
    last_verified_at = excluded.last_verified_at,
    updated_at = now();

alter table core.sessions
  add column if not exists contact_id uuid references business.contacts(id) on delete set null,
  add column if not exists active_customer_event_id uuid references business.customer_events(id) on delete set null;

alter table core.events
  add column if not exists customer_event_id uuid references business.customer_events(id) on delete set null;

create index if not exists sessions_contact_idx
  on core.sessions (contact_id)
  where contact_id is not null;
create index if not exists sessions_active_customer_event_idx
  on core.sessions (active_customer_event_id)
  where active_customer_event_id is not null;
create index if not exists core_events_customer_event_idx
  on core.events (customer_event_id, created_at desc)
  where customer_event_id is not null;

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
       set is_current = false
     where id = v_previous.id;
  end if;

  insert into business.event_facts (
    customer_event_id, fact_key, fact_value, fact_status, source_type,
    source_event_id, source_ref, confidence, supersedes_fact_id,
    actor_ref, metadata
  )
  values (
    p_customer_event_id, p_fact_key, p_fact_value, p_fact_status, p_source_type,
    p_source_event_id, p_source_ref, p_confidence, v_previous.id,
    p_actor_ref, coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_new;

  return v_new;
end;
$$;

create or replace function business.transition_customer_event(
  p_customer_event_id uuid,
  p_expected_version bigint,
  p_to_stage text,
  p_actor_type text default 'system',
  p_actor_ref text default null,
  p_reason_code text default null,
  p_trigger_event_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  customer_event_id uuid,
  from_stage text,
  to_stage text,
  stage_version bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_from_stage text;
  v_current_version bigint;
begin
  select e.lifecycle_stage, e.stage_version
    into v_from_stage, v_current_version
    from business.customer_events e
   where e.id = p_customer_event_id
   for update;

  if not found then
    raise exception 'customer_event_not_found';
  end if;

  if v_current_version <> p_expected_version then
    raise exception 'event_stage_version_conflict'
      using errcode = '40001',
            detail = format('expected=%s actual=%s', p_expected_version, v_current_version);
  end if;

  update business.customer_events
     set lifecycle_stage = p_to_stage,
         stage_version = stage_version + 1
   where id = p_customer_event_id;

  insert into core.events (
    session_id, customer_event_id, event_type, direction, source,
    correlation_id, idempotency_key, payload, occurred_at
  )
  select
    s.id,
    p_customer_event_id,
    'business.lifecycle_transition',
    'internal',
    'business.transition_customer_event',
    null,
    null,
    jsonb_build_object(
      'from_stage', v_from_stage,
      'to_stage', p_to_stage,
      'actor_type', coalesce(nullif(p_actor_type,''),'system'),
      'actor_ref', p_actor_ref,
      'reason_code', p_reason_code,
      'trigger_event_id', p_trigger_event_id,
      'metadata', coalesce(p_metadata, '{}'::jsonb)
    ),
    now()
  from core.sessions s
  where s.active_customer_event_id = p_customer_event_id
  order by s.updated_at desc
  limit 1;

  return query
  select p_customer_event_id, v_from_stage, p_to_stage, v_current_version + 1;
end;
$$;

create trigger contacts_touch_updated_at
before update on business.contacts
for each row execute function core.touch_updated_at();

create trigger customer_events_touch_updated_at
before update on business.customer_events
for each row execute function core.touch_updated_at();

create trigger event_services_touch_updated_at
before update on business.event_services
for each row execute function core.touch_updated_at();

create trigger contracts_touch_updated_at
before update on business.contracts
for each row execute function core.touch_updated_at();

create trigger payments_touch_updated_at
before update on business.payments
for each row execute function core.touch_updated_at();

create trigger art_jobs_touch_updated_at
before update on business.art_jobs
for each row execute function core.touch_updated_at();

create trigger logistics_touch_updated_at
before update on business.logistics
for each row execute function core.touch_updated_at();

create trigger deliveries_touch_updated_at
before update on business.deliveries
for each row execute function core.touch_updated_at();

create trigger campaigns_touch_updated_at
before update on business.campaigns
for each row execute function core.touch_updated_at();

create trigger followups_touch_updated_at
before update on business.followups
for each row execute function core.touch_updated_at();

create trigger integrations_registry_touch_updated_at
before update on integrations.registry
for each row execute function core.touch_updated_at();

alter table business.contacts enable row level security;
alter table business.customer_events enable row level security;
alter table business.event_services enable row level security;
alter table business.event_facts enable row level security;
alter table business.module_states enable row level security;
alter table business.quotes enable row level security;
alter table business.contracts enable row level security;
alter table business.payments enable row level security;
alter table business.art_jobs enable row level security;
alter table business.logistics enable row level security;
alter table business.deliveries enable row level security;
alter table business.publication_consents enable row level security;
alter table business.campaigns enable row level security;
alter table business.followups enable row level security;
alter table business.human_handoffs enable row level security;
alter table integrations.registry enable row level security;

revoke all on all tables in schema business from public, anon, authenticated;
revoke all on all tables in schema integrations from public, anon, authenticated;
revoke execute on all functions in schema business from public, anon, authenticated;

grant select, insert, update, delete on all tables in schema business to service_role;
grant select, insert, update, delete on all tables in schema integrations to service_role;
grant execute on function business.record_event_fact(uuid,text,jsonb,text,text,uuid,text,numeric,text,jsonb) to service_role;
grant execute on function business.transition_customer_event(uuid,bigint,text,text,text,text,uuid,jsonb) to service_role;

alter default privileges for role postgres in schema business
  revoke select, insert, update, delete on tables from public, anon, authenticated;
alter default privileges for role postgres in schema integrations
  revoke select, insert, update, delete on tables from public, anon, authenticated;
alter default privileges for role postgres in schema business
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema integrations
  revoke execute on functions from public, anon, authenticated;

comment on schema business is 'Click Mais business state: contacts, customer events, facts and operational modules.';
comment on schema integrations is 'Non-secret integration registry and runtime readiness flags.';
comment on table business.event_facts is 'Append-only fact history with provenance; only one current fact per key/event.';
comment on table business.module_states is 'Deterministic readiness/completeness per operational module.';
comment on table integrations.registry is 'Integration map; never stores secrets or credentials.';
