-- Click Mais OS Fase 1 / F1.2
-- Canonical source: FASE_0_ESPECIFICACAO_EXECUTAVEL_v1.2.1
-- Scope: business/core compatibility for canonical v1.2.1 state model.
-- Legacy columns are preserved where removal could break existing consumers.

alter table core.events
  add column if not exists event_version text not null default '1.0.0';

alter table business.contacts
  add column if not exists contact_category text not null default 'unknown';

alter table business.contacts
  drop constraint if exists contacts_contact_category_check;
alter table business.contacts
  add constraint contacts_contact_category_check
  check (contact_category in (
    'unknown','commercial_external','vendor','venue','staff',
    'personal','institution','automated','other'
  ));

update business.contacts
set contact_category = case relationship_type
  when 'vendor' then 'vendor'
  when 'venue' then 'venue'
  when 'staff' then 'staff'
  when 'personal' then 'personal'
  when 'lead' then 'commercial_external'
  when 'customer' then 'commercial_external'
  else 'unknown'
end
where contact_category = 'unknown';

comment on column business.contacts.relationship_type
is 'LEGACY v1.1. Commercial lead/customer status belongs to customer_events, not contact.';
comment on column business.contacts.chatwoot_contact_id
is 'LEGACY drift. Chatwoot is OUT_OF_SCOPE_V1 in Fase 0 v1.2.1.';

create table if not exists business.contact_identities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references business.contacts(id) on delete cascade,
  identity_type text not null
    check (identity_type in ('phone_e164','whatsapp_id','email','external')),
  identity_value text not null,
  normalized_value text not null,
  verified boolean not null default false,
  is_primary boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (identity_type, normalized_value)
);

create index if not exists contact_identities_contact_idx
  on business.contact_identities (contact_id);

insert into business.contact_identities
  (contact_id, identity_type, identity_value, normalized_value, verified, is_primary)
select id, 'phone_e164', phone_e164, phone_e164, true, true
from business.contacts
where phone_e164 is not null
on conflict (identity_type, normalized_value) do nothing;

insert into business.contact_identities
  (contact_id, identity_type, identity_value, normalized_value, verified, is_primary)
select id, 'whatsapp_id', whatsapp_id, whatsapp_id, true, false
from business.contacts
where whatsapp_id is not null
on conflict (identity_type, normalized_value) do nothing;

create table if not exists business.acquisition_touchpoints (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references business.contacts(id) on delete set null,
  customer_event_id uuid references business.customer_events(id) on delete set null,
  session_id uuid references core.sessions(id) on delete set null,
  source text not null default 'unknown'
    check (source in ('paid_ads','organic','direct','referral','unknown')),
  medium text,
  landing_page_code text,
  service_interest_code text,
  campaign_code text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  tracking_token text,
  raw_prefilled_message text,
  attribution_confidence numeric(4,3)
    check (attribution_confidence is null or (attribution_confidence >= 0 and attribution_confidence <= 1)),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists acquisition_touchpoints_event_idx
  on business.acquisition_touchpoints (customer_event_id, occurred_at desc);
create index if not exists acquisition_touchpoints_contact_idx
  on business.acquisition_touchpoints (contact_id, occurred_at desc);
create index if not exists acquisition_touchpoints_campaign_idx
  on business.acquisition_touchpoints (campaign_code, occurred_at desc)
  where campaign_code is not null;
create index if not exists acquisition_touchpoints_landing_idx
  on business.acquisition_touchpoints (landing_page_code, occurred_at desc)
  where landing_page_code is not null;

alter table business.customer_events
  add column if not exists primary_touchpoint_id uuid,
  add column if not exists locality_id uuid,
  add column if not exists commercial_stage text not null default 'PRE_QUOTE',
  add column if not exists operational_stage text not null default 'NOT_STARTED',
  add column if not exists qualified_at timestamptz,
  add column if not exists won_at timestamptz,
  add column if not exists lost_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table business.customer_events
  drop constraint if exists customer_events_primary_touchpoint_id_fkey;
alter table business.customer_events
  add constraint customer_events_primary_touchpoint_id_fkey
  foreign key (primary_touchpoint_id)
  references business.acquisition_touchpoints(id) on delete set null;

alter table business.customer_events
  drop constraint if exists customer_events_locality_id_fkey;
alter table business.customer_events
  add constraint customer_events_locality_id_fkey
  foreign key (locality_id)
  references catalog.localities(id) on delete restrict;

alter table business.customer_events
  drop constraint if exists customer_events_commercial_stage_check;
alter table business.customer_events
  add constraint customer_events_commercial_stage_check
  check (commercial_stage in (
    'PRE_QUOTE','ORCAMENTO','RESPOSTA','FAC_DUVIDAS',
    'NEGOCIACAO','FECHAMENTO','GANHO','PERDIDO'
  ));

alter table business.customer_events
  drop constraint if exists customer_events_operational_stage_check;
alter table business.customer_events
  add constraint customer_events_operational_stage_check
  check (operational_stage in (
    'NOT_STARTED','PRE_EVENT','EVENT_READY','EVENT_DAY',
    'POST_EVENT','COMPLETED','SUSPENDED','CANCELLED'
  ));

update business.customer_events
set commercial_stage = case lifecycle_stage
  when 'quote_presented' then 'ORCAMENTO'
  when 'awaiting_decision' then 'RESPOSTA'
  when 'negotiation_human' then 'NEGOCIACAO'
  when 'contracting' then 'FECHAMENTO'
  when 'contracted_pre_event' then 'FECHAMENTO'
  when 'event_day' then 'FECHAMENTO'
  when 'post_event' then 'FECHAMENTO'
  when 'completed' then 'FECHAMENTO'
  when 'lost' then 'PERDIDO'
  when 'cancelled' then 'PERDIDO'
  else 'PRE_QUOTE'
end,
operational_stage = case lifecycle_stage
  when 'contracted_pre_event' then 'PRE_EVENT'
  when 'event_day' then 'EVENT_DAY'
  when 'post_event' then 'POST_EVENT'
  when 'completed' then 'COMPLETED'
  when 'cancelled' then 'CANCELLED'
  else 'NOT_STARTED'
end;

update business.customer_events e
set qualified_at = q.presented_at
from (
  select customer_event_id, min(presented_at) as presented_at
  from business.quotes
  where status in ('presented','accepted','rejected','expired','superseded')
    and presented_at is not null
  group by customer_event_id
) q
where q.customer_event_id = e.id
  and e.qualified_at is null;

create index if not exists customer_events_commercial_stage_status_idx
  on business.customer_events (commercial_stage, status);
create index if not exists customer_events_event_date_stage_idx
  on business.customer_events (event_date, commercial_stage);
create index if not exists customer_events_qualified_at_idx
  on business.customer_events (qualified_at)
  where qualified_at is not null;
create index if not exists customer_events_won_at_idx
  on business.customer_events (won_at)
  where won_at is not null;
create index if not exists customer_events_locality_idx
  on business.customer_events (locality_id)
  where locality_id is not null;

comment on column business.customer_events.lifecycle_stage
is 'LEGACY v1.1 compatibility field. Canonical v1.2.1 commercial state is commercial_stage plus operational_stage.';

alter table business.event_services
  add column if not exists service_id uuid,
  add column if not exists quantity integer not null default 1
    check (quantity > 0);

alter table business.event_services
  alter column service_code drop not null;

alter table business.event_services
  drop constraint if exists event_services_service_id_fkey;
alter table business.event_services
  add constraint event_services_service_id_fkey
  foreign key (service_id) references catalog.services(id) on delete restrict;

alter table business.event_services
  drop constraint if exists event_services_service_reference_check;
alter table business.event_services
  add constraint event_services_service_reference_check
  check (service_id is not null or service_code is not null);

create unique index if not exists event_services_event_service_id_uidx
  on business.event_services (customer_event_id, service_id)
  where service_id is not null;

alter table business.event_facts
  add column if not exists valid_from timestamptz not null default now(),
  add column if not exists valid_to timestamptz,
  add column if not exists critical boolean not null default false;

alter table business.event_facts
  drop constraint if exists event_facts_validity_check;
alter table business.event_facts
  add constraint event_facts_validity_check
  check (valid_to is null or valid_to >= valid_from);

alter table business.module_states
  drop constraint if exists module_states_module_code_check;
alter table business.module_states
  add constraint module_states_module_code_check
  check (module_code in (
    'quote','contract','payment','art','logistics',
    'delivery','post_sale','reservation'
  ));

alter table business.quotes
  drop constraint if exists quotes_status_check;
alter table business.quotes
  add constraint quotes_status_check
  check (status in (
    'draft','ready','presented','accepted','rejected','expired','superseded'
  ));

alter table business.quotes
  add column if not exists rule_set_version text,
  add column if not exists locality_id uuid,
  add column if not exists pricing_tier_id uuid,
  add column if not exists event_date_snapshot date,
  add column if not exists fingerprint text,
  add column if not exists valid_until timestamptz,
  add column if not exists presented_message_event_id uuid;

alter table business.quotes
  drop constraint if exists quotes_locality_id_fkey;
alter table business.quotes
  add constraint quotes_locality_id_fkey
  foreign key (locality_id) references catalog.localities(id) on delete restrict;

alter table business.quotes
  drop constraint if exists quotes_pricing_tier_id_fkey;
alter table business.quotes
  add constraint quotes_pricing_tier_id_fkey
  foreign key (pricing_tier_id) references catalog.pricing_tiers(id) on delete restrict;

alter table business.quotes
  drop constraint if exists quotes_presented_message_event_id_fkey;
alter table business.quotes
  add constraint quotes_presented_message_event_id_fkey
  foreign key (presented_message_event_id) references core.events(id) on delete set null;

create unique index if not exists quotes_event_fingerprint_uidx
  on business.quotes (customer_event_id, fingerprint)
  where fingerprint is not null;

create table if not exists business.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references business.quotes(id) on delete cascade,
  position integer not null check (position > 0),
  service_id uuid references catalog.services(id) on delete restrict,
  line_type text not null
    check (line_type in ('main','addon','gift','adjustment')),
  quantity integer not null default 1 check (quantity > 0),
  base_pix numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  final_pix numeric(12,2) not null default 0,
  final_card numeric(12,2) not null default 0,
  rule_refs jsonb not null default '[]'::jsonb,
  customer_visible_label text,
  created_at timestamptz not null default now(),
  unique (quote_id, position),
  check (base_pix >= 0 and discount_amount >= 0 and final_pix >= 0 and final_card >= 0)
);

create index if not exists quote_items_quote_idx
  on business.quote_items (quote_id);

create table if not exists business.reservations (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid not null references business.customer_events(id) on delete restrict,
  status text not null default 'none'
    check (status in (
      'none','preliminary','pending_confirmation','confirmed',
      'released','cancelled','human_review'
    )),
  availability_status text not null default 'unknown'
    check (availability_status in ('unknown','preliminary','available','unavailable','human_required')),
  confirmed_at timestamptz,
  released_at timestamptz,
  reason_code text,
  source text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reservations_one_active_event_uidx
  on business.reservations (customer_event_id)
  where status in ('preliminary','pending_confirmation','confirmed','human_review');

alter table business.contracts
  add column if not exists source_event_id uuid references core.events(id) on delete set null;

alter table business.payments
  add column if not exists external_transaction_ref text,
  add column if not exists verification_version integer not null default 0 check (verification_version >= 0),
  add column if not exists source_event_id uuid references core.events(id) on delete set null;

create unique index if not exists payments_external_transaction_ref_uidx
  on business.payments (external_transaction_ref)
  where external_transaction_ref is not null;

alter table business.art_jobs
  add column if not exists version integer not null default 1 check (version > 0),
  add column if not exists source_event_id uuid references core.events(id) on delete set null;

alter table business.logistics
  add column if not exists version integer not null default 1 check (version > 0),
  add column if not exists source_event_id uuid references core.events(id) on delete set null;

alter table business.deliveries
  add column if not exists version integer not null default 1 check (version > 0),
  add column if not exists source_event_id uuid references core.events(id) on delete set null;

create table if not exists business.campaign_members (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references business.campaigns(id) on delete cascade,
  customer_event_id uuid not null references business.customer_events(id) on delete cascade,
  eligibility_status text not null default 'eligible'
    check (eligibility_status in (
      'eligible','excluded','approved','sent','failed','responded','converted'
    )),
  eligibility_reason text,
  segment_snapshot jsonb not null default '{}'::jsonb,
  offer_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, customer_event_id)
);

create table if not exists business.human_tasks (
  id uuid primary key default gen_random_uuid(),
  customer_event_id uuid references business.customer_events(id) on delete set null,
  session_id uuid references core.sessions(id) on delete set null,
  task_type text not null,
  status text not null default 'open'
    check (status in ('open','in_progress','resolved','cancelled')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','critical')),
  owner_ref text,
  due_at timestamptz,
  reason_code text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists human_tasks_open_due_idx
  on business.human_tasks (status, due_at)
  where status in ('open','in_progress');

alter table business.contact_identities enable row level security;
alter table business.acquisition_touchpoints enable row level security;
alter table business.quote_items enable row level security;
alter table business.reservations enable row level security;
alter table business.campaign_members enable row level security;
alter table business.human_tasks enable row level security;

revoke all on business.contact_identities,
              business.acquisition_touchpoints,
              business.quote_items,
              business.reservations,
              business.campaign_members,
              business.human_tasks
from public, anon, authenticated;

grant select, insert, update, delete on
  business.contact_identities,
  business.acquisition_touchpoints,
  business.quote_items,
  business.reservations,
  business.campaign_members,
  business.human_tasks
to service_role;

drop trigger if exists reservations_touch_updated_at on business.reservations;
create trigger reservations_touch_updated_at
before update on business.reservations
for each row execute function core.touch_updated_at();

drop trigger if exists campaign_members_touch_updated_at on business.campaign_members;
create trigger campaign_members_touch_updated_at
before update on business.campaign_members
for each row execute function core.touch_updated_at();

drop trigger if exists human_tasks_touch_updated_at on business.human_tasks;
create trigger human_tasks_touch_updated_at
before update on business.human_tasks
for each row execute function core.touch_updated_at();

drop function if exists business.transition_customer_event(uuid,bigint,text,text,text,text,uuid,jsonb);

create function business.transition_customer_event(
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
  stage_version bigint,
  transition_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_from_stage text;
  v_current_version bigint;
  v_transition_id uuid;
begin
  if p_to_stage not in (
    'PRE_QUOTE','ORCAMENTO','RESPOSTA','FAC_DUVIDAS',
    'NEGOCIACAO','FECHAMENTO','GANHO','PERDIDO'
  ) then
    raise exception 'invalid_commercial_stage';
  end if;

  select e.commercial_stage, e.stage_version
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

  update business.customer_events as e
     set commercial_stage = p_to_stage,
         stage_version = e.stage_version + 1
   where e.id = p_customer_event_id;

  insert into business.event_stage_transitions (
    customer_event_id, trigger_event_id, from_stage, to_stage,
    reason_code, actor_type, actor_ref, metadata
  )
  values (
    p_customer_event_id, p_trigger_event_id, v_from_stage, p_to_stage,
    p_reason_code, coalesce(nullif(p_actor_type,''),'system'), p_actor_ref,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_transition_id;

  return query
  select p_customer_event_id, v_from_stage, p_to_stage,
         v_current_version + 1, v_transition_id;
end;
$$;

revoke execute on function business.transition_customer_event(uuid,bigint,text,text,text,text,uuid,jsonb)
from public, anon, authenticated;
grant execute on function business.transition_customer_event(uuid,bigint,text,text,text,text,uuid,jsonb)
to service_role;

comment on function business.transition_customer_event(uuid,bigint,text,text,text,text,uuid,jsonb)
is 'Canonical v1.2.1 commercial stage transition with optimistic locking and append-only transition history.';
