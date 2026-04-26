-- OpenMiami_OSS — Supabase schema
-- License: MIT
-- Target: Postgres 15+ on Supabase, with PostGIS
--
-- Conventions:
--   * Public read on `resources` (only verified rows).
--   * Public insert on `resource_suggestions` (community submissions, moderated).
--   * Audit log captures every change to `resources`.
--   * No PII columns. `contact` is org-level contact info only.

begin;

create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- ============================================================
-- Enums
-- ============================================================

do $$ begin
  create type provider_type as enum (
    'lhrt',
    'city_of_miami',
    'miami_dade_311',
    'miami_dade_county',
    'state',
    'federal',
    'nonprofit',
    'mutual_aid',
    'faith_based',
    'business'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_category as enum (
    'housing',
    'food',
    'health',
    'mental_health',
    'small_business',
    'workforce',
    'education',
    'youth',
    'seniors',
    'immigration',
    'legal',
    'arts_culture',
    'climate_resilience',
    'transit',
    'utilities',
    'civic_311',
    'emergency'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type suggestion_status as enum ('pending', 'approved', 'rejected', 'duplicate');
exception when duplicate_object then null; end $$;

-- ============================================================
-- resources
-- ============================================================

create table if not exists public.resources (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  provider_type   provider_type not null,
  category        resource_category not null,
  description     text,
  eligibility     jsonb not null default '{}'::jsonb,
  languages       text[] not null default array['en']::text[],
  contact         jsonb not null default '{}'::jsonb,
  -- WGS84 point. Geography type lets us do meters-based ST_DWithin.
  location        geography(point, 4326),
  source_url      text not null,
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint resources_source_url_https check (source_url ~* '^https?://'),
  constraint resources_languages_nonempty check (array_length(languages, 1) >= 1)
);

create index if not exists resources_location_gix on public.resources using gist (location);
create index if not exists resources_languages_gin on public.resources using gin (languages);
create index if not exists resources_category_idx  on public.resources (category);
create index if not exists resources_provider_idx  on public.resources (provider_type);
create index if not exists resources_verified_idx  on public.resources (verified_at) where verified_at is not null;

-- Touch updated_at
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists resources_touch_updated_at on public.resources;
create trigger resources_touch_updated_at
  before update on public.resources
  for each row execute function public.tg_touch_updated_at();

-- ============================================================
-- resource_suggestions (community submissions)
-- ============================================================

create table if not exists public.resource_suggestions (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  provider_type   provider_type,
  category        resource_category,
  description     text,
  languages       text[] default array['en']::text[],
  contact         jsonb not null default '{}'::jsonb,
  location        geography(point, 4326),
  source_url      text,
  submitter_note  text,
  status          suggestion_status not null default 'pending',
  reviewed_by     uuid,                       -- supabase auth.users(id) of moderator
  reviewed_at     timestamptz,
  promoted_resource_id uuid references public.resources(id) on delete set null,
  created_at      timestamptz not null default now(),

  constraint suggestions_source_url_https
    check (source_url is null or source_url ~* '^https?://')
);

create index if not exists suggestions_status_idx on public.resource_suggestions (status);
create index if not exists suggestions_created_idx on public.resource_suggestions (created_at desc);

-- ============================================================
-- audit log on resources
-- ============================================================

create table if not exists public.resources_audit (
  audit_id     bigserial primary key,
  resource_id  uuid,
  op           text not null check (op in ('INSERT','UPDATE','DELETE')),
  changed_at   timestamptz not null default now(),
  changed_by   uuid,                          -- auth.uid() if available
  before_row   jsonb,
  after_row    jsonb
);

create index if not exists resources_audit_resource_idx on public.resources_audit (resource_id);
create index if not exists resources_audit_changed_idx  on public.resources_audit (changed_at desc);

create or replace function public.tg_resources_audit()
returns trigger language plpgsql security definer as $$
declare
  v_uid uuid;
begin
  begin
    v_uid := auth.uid();
  exception when others then
    v_uid := null;
  end;

  if tg_op = 'INSERT' then
    insert into public.resources_audit (resource_id, op, changed_by, before_row, after_row)
    values (new.id, 'INSERT', v_uid, null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.resources_audit (resource_id, op, changed_by, before_row, after_row)
    values (new.id, 'UPDATE', v_uid, to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.resources_audit (resource_id, op, changed_by, before_row, after_row)
    values (old.id, 'DELETE', v_uid, to_jsonb(old), null);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists resources_audit_trg on public.resources;
create trigger resources_audit_trg
  after insert or update or delete on public.resources
  for each row execute function public.tg_resources_audit();

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.resources              enable row level security;
alter table public.resource_suggestions   enable row level security;
alter table public.resources_audit        enable row level security;

-- resources: anyone can read verified rows
drop policy if exists "resources read verified" on public.resources;
create policy "resources read verified"
  on public.resources for select
  using (verified_at is not null);

-- resources: writes only via service role (default; no policy = blocked for anon/authenticated)

-- resource_suggestions: anyone can insert; nobody can read except service role
drop policy if exists "suggestions insert public" on public.resource_suggestions;
create policy "suggestions insert public"
  on public.resource_suggestions for insert
  with check (true);

-- audit table: service role only (no policies for anon/authenticated => locked down)

commit;
