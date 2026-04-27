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

do $$ begin
  create type verse_kind as enum (
    'platform',      -- top-level umbrella (e.g. SustainaCities)
    'state',         -- e.g. FloridaVerse
    'metro',         -- e.g. MiamiVerse
    'neighborhood',  -- e.g. OpenMiami / LHRT scope
    'theme'          -- cross-cutting theme like 'climate', 'youth'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type url_check_status as enum ('ok', 'redirect', 'client_error', 'server_error', 'unreachable', 'unknown');
exception when duplicate_object then null; end $$;

-- ============================================================
-- verses — hierarchical "CityVerse" registry
-- ============================================================
-- A verse is a scoped surface that can host its own front end and
-- own its own seeded resources. Verses form a tree:
--   sustainacities (platform)
--   └── floridaverse (state)
--       └── miamiverse (metro)
--           ├── openmiami (neighborhood: City of Miami)
--           └── lhrt      (neighborhood: Little Haiti boundary)
--
-- A resource lives in exactly one verse but is visible to that verse's
-- ancestors (queries can roll up: floridaverse sees all of MiamiVerse's
-- resources). The resolution logic lives in the API, not the DB — the
-- DB just stores the tree and the assignment.

create table if not exists public.verses (
  id              uuid primary key default uuid_generate_v4(),
  slug            text not null unique,
  name            text not null,
  kind            verse_kind not null,
  parent_id       uuid references public.verses(id) on delete set null,
  scope_geom      geography(multipolygon, 4326),  -- optional: jurisdictional scope
  default_languages text[] not null default array['en']::text[],
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),

  constraint verses_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]*$')
);

create index if not exists verses_parent_idx on public.verses (parent_id);
create index if not exists verses_kind_idx   on public.verses (kind);
create index if not exists verses_scope_gix  on public.verses using gist (scope_geom);

-- Recursive descendants helper: every verse reachable from a root.
create or replace function public.verse_descendants(root_slug text)
returns table (id uuid, slug text, depth int)
language sql stable as $$
  with recursive tree as (
    select v.id, v.slug, 0 as depth
    from public.verses v
    where v.slug = root_slug
    union all
    select c.id, c.slug, t.depth + 1
    from public.verses c
    join tree t on c.parent_id = t.id
  )
  select * from tree;
$$;

-- ============================================================
-- resources
-- ============================================================

create table if not exists public.resources (
  id              uuid primary key default uuid_generate_v4(),
  verse_id        uuid references public.verses(id) on delete set null,
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
  -- Link health (populated by scripts/check-links.js)
  url_status      url_check_status,
  url_status_code int,
  url_checked_at  timestamptz,
  -- Data ranking score, 0..100. Higher = more trustworthy/fresh.
  -- Computed by tg_resources_health_score() on insert/update.
  health_score    int not null default 50,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint resources_source_url_https check (source_url ~* '^https?://'),
  constraint resources_languages_nonempty check (array_length(languages, 1) >= 1),
  constraint resources_health_score_range check (health_score between 0 and 100)
);

create index if not exists resources_verse_idx     on public.resources (verse_id);
create index if not exists resources_location_gix  on public.resources using gist (location);
create index if not exists resources_languages_gin on public.resources using gin (languages);
create index if not exists resources_category_idx  on public.resources (category);
create index if not exists resources_provider_idx  on public.resources (provider_type);
create index if not exists resources_verified_idx  on public.resources (verified_at) where verified_at is not null;
create index if not exists resources_health_idx    on public.resources (health_score desc);
create index if not exists resources_url_status_idx on public.resources (url_status) where url_status is not null;

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
-- resource_url_checks — historical link-health log
-- ============================================================
-- Append-only log written by scripts/check-links.js. Drives the
-- `url_status*` columns and the health_score on `resources`.

create table if not exists public.resource_url_checks (
  id            bigserial primary key,
  resource_id   uuid not null references public.resources(id) on delete cascade,
  checked_at    timestamptz not null default now(),
  status        url_check_status not null,
  status_code   int,
  response_ms   int,
  final_url     text,                   -- after redirects
  content_hash  text,                   -- sha256 of body, for change detection
  notes         text
);

create index if not exists url_checks_resource_idx on public.resource_url_checks (resource_id, checked_at desc);
create index if not exists url_checks_status_idx   on public.resource_url_checks (status);

-- ============================================================
-- Health score
-- ============================================================
-- Heuristic 0..100 score driven by:
--   + verified_at recency
--   + url_status = 'ok'
--   - url_status in ('client_error','server_error','unreachable')
--   + non-empty description, non-empty contact
--   + has location
-- Recomputed on every insert/update of `resources`.

create or replace function public.compute_resource_health(r public.resources)
returns int language plpgsql immutable as $$
declare
  s int := 50;
  age_days int;
begin
  if r.verified_at is not null then
    age_days := greatest(0, extract(day from (now() - r.verified_at))::int);
    if age_days < 30 then s := s + 20;
    elsif age_days < 90 then s := s + 10;
    elsif age_days < 365 then s := s + 0;
    else s := s - 10;
    end if;
  else
    s := s - 20;
  end if;

  if r.url_status = 'ok' then s := s + 15;
  elsif r.url_status = 'redirect' then s := s + 5;
  elsif r.url_status in ('client_error','server_error','unreachable') then s := s - 30;
  end if;

  if r.description is not null and length(r.description) > 20 then s := s + 5; end if;
  if (r.contact - '{}'::jsonb) is not null and r.contact <> '{}'::jsonb then s := s + 5; end if;
  if r.location is not null then s := s + 5; end if;

  return greatest(0, least(100, s));
end;
$$;

create or replace function public.tg_resources_health_score()
returns trigger language plpgsql as $$
begin
  new.health_score := public.compute_resource_health(new);
  return new;
end;
$$;

drop trigger if exists resources_health_score_trg on public.resources;
create trigger resources_health_score_trg
  before insert or update on public.resources
  for each row execute function public.tg_resources_health_score();

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.resources              enable row level security;
alter table public.resource_suggestions   enable row level security;
alter table public.resources_audit        enable row level security;
alter table public.verses                  enable row level security;
alter table public.resource_url_checks     enable row level security;

-- verses: public read of the whole tree
drop policy if exists "verses read public" on public.verses;
create policy "verses read public"
  on public.verses for select
  using (true);

-- resource_url_checks: service role only (no policies for anon/authenticated)

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
