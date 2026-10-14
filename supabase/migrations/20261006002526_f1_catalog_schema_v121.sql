-- Click Mais OS Fase 1 / F1.1
-- Canonical source: FASE_0_ESPECIFICACAO_EXECUTAVEL_v1.2.1
-- Scope: catalog schema only. No outbound side effects.

create schema if not exists catalog;

revoke all on schema catalog from public, anon, authenticated;
grant usage on schema catalog to service_role;

create table if not exists catalog.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  official_name text not null,
  category text not null check (category in ('main','addon')),
  active boolean not null default true,
  quoteable_automatically boolean not null default false,
  details_json jsonb not null default '{}'::jsonb,
  source_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  pix_base numeric(12,2) not null check (pix_base >= 0),
  active_from date,
  active_to date,
  source_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (active_to is null or active_from is null or active_to >= active_from)
);

create table if not exists catalog.localities (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  normalized_name text not null unique,
  pricing_tier_id uuid references catalog.pricing_tiers(id) on delete restrict,
  status text not null default 'active'
    check (status in ('active','human_required','disabled')),
  notes text,
  source_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'active' or pricing_tier_id is not null)
);

create table if not exists catalog.locality_aliases (
  id uuid primary key default gen_random_uuid(),
  locality_id uuid not null references catalog.localities(id) on delete cascade,
  alias text not null,
  normalized_alias text not null unique,
  active boolean not null default true,
  source_version text not null,
  created_at timestamptz not null default now()
);

create table if not exists catalog.commercial_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  rule_version text not null,
  rule_value jsonb not null,
  active_from timestamptz,
  active_to timestamptz,
  source_version text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (rule_key, rule_version),
  check (active_to is null or active_from is null or active_to >= active_from)
);

create index if not exists catalog_localities_tier_idx
  on catalog.localities (pricing_tier_id)
  where pricing_tier_id is not null;

create index if not exists catalog_localities_status_idx
  on catalog.localities (status);

create index if not exists catalog_aliases_locality_idx
  on catalog.locality_aliases (locality_id);

create index if not exists catalog_rules_key_active_idx
  on catalog.commercial_rules (rule_key, active_from desc);

alter table catalog.services enable row level security;
alter table catalog.pricing_tiers enable row level security;
alter table catalog.localities enable row level security;
alter table catalog.locality_aliases enable row level security;
alter table catalog.commercial_rules enable row level security;

revoke all on all tables in schema catalog from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema catalog to service_role;

alter default privileges for role postgres in schema catalog
  revoke select, insert, update, delete on tables from public, anon, authenticated;

drop trigger if exists services_touch_updated_at on catalog.services;
create trigger services_touch_updated_at
before update on catalog.services
for each row execute function core.touch_updated_at();

drop trigger if exists pricing_tiers_touch_updated_at on catalog.pricing_tiers;
create trigger pricing_tiers_touch_updated_at
before update on catalog.pricing_tiers
for each row execute function core.touch_updated_at();

drop trigger if exists localities_touch_updated_at on catalog.localities;
create trigger localities_touch_updated_at
before update on catalog.localities
for each row execute function core.touch_updated_at();

comment on schema catalog is 'Deterministic Click Mais business catalog: services, prices, localities, aliases and commercial rules.';
comment on table catalog.pricing_tiers is 'Internal pricing tiers. Tier codes must never be exposed to customers.';
comment on table catalog.localities is 'Canonical locality registry. Unknown or ambiguous localities are not auto-priced.';
comment on table catalog.commercial_rules is 'Versioned deterministic commercial rules; no LLM authority.';
