-- Initial schema for HabibStay
-- This script is intended to be run with elevated privileges (e.g., Supabase SQL editor or CLI).

-- Enable needed extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- SCHEMA: auth is managed by Supabase. We'll create application tables in public.

-- ROLES & PERMISSIONS
create table if not exists public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, role_id)
);

-- CONFIGURATION
create table if not exists public.config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- FEATURE FLAGS
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- DOMAIN: PROPERTIES
create table if not exists public.hosts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  rating numeric(3,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  image_url text not null,
  location text not null,
  bedrooms int not null check (bedrooms >= 0),
  bathrooms int not null check (bathrooms >= 0),
  host_id uuid not null references public.hosts(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rental durations and prices
create type if not exists rental_duration as enum ('daily','weekly','monthly');

create table if not exists public.property_prices (
  property_id uuid not null references public.properties(id) on delete cascade,
  duration rental_duration not null,
  price numeric(12,2) not null check (price >= 0),
  primary key(property_id, duration)
);

create table if not exists public.amenities (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null
);

create table if not exists public.property_amenities (
  property_id uuid not null references public.properties(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key(property_id, amenity_id)
);

-- Investment details
create table if not exists public.property_investments (
  property_id uuid primary key references public.properties(id) on delete cascade,
  available boolean not null default false,
  expected_return numeric(5,2),
  min_investment numeric(14,2)
);

-- VIEW for simplified property card shape
create or replace view public.property_cards_view as
select
  p.id,
  p.title,
  p.image_url as imageUrl,
  p.location,
  p.bedrooms,
  p.bathrooms,
  jsonb_build_object(
    'id', h.id,
    'name', h.name,
    'rating', coalesce(h.rating, 0)
  ) as host,
  jsonb_object_agg(pp.duration::text, pp.price order by pp.duration) as priceByDuration,
  array_agg(a.name order by a.name) filter (where a.id is not null) as amenities,
  jsonb_build_object(
    'available', coalesce(pi.available, false),
    'expectedReturn', pi.expected_return,
    'minInvestment', pi.min_investment
  ) as investmentDetails
from public.properties p
join public.hosts h on h.id = p.host_id
left join public.property_prices pp on pp.property_id = p.id
left join public.property_amenities pa on pa.property_id = p.id
left join public.amenities a on a.id = pa.amenity_id
left join public.property_investments pi on pi.property_id = p.id
group by p.id, h.id, pi.property_id, pi.available, pi.expected_return, pi.min_investment;

-- Indexes
create index if not exists idx_properties_location on public.properties using gin (to_tsvector('simple', location));
create index if not exists idx_properties_title on public.properties using gin (to_tsvector('simple', title));

-- RLS Policies
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.config enable row level security;
alter table public.feature_flags enable row level security;
alter table public.hosts enable row level security;
alter table public.properties enable row level security;
alter table public.property_prices enable row level security;
alter table public.amenities enable row level security;
alter table public.property_amenities enable row level security;
alter table public.property_investments enable row level security;

-- Basic read for everyone (anon) on property view
grant usage on schema public to anon, authenticated;
grant select on public.property_cards_view to anon, authenticated;

-- Allow read on public catalog tables
create policy if not exists "Allow read for all on hosts" on public.hosts for select using (true);
create policy if not exists "Allow read for all on properties" on public.properties for select using (true);
create policy if not exists "Allow read for all on property_prices" on public.property_prices for select using (true);
create policy if not exists "Allow read for all on amenities" on public.amenities for select using (true);
create policy if not exists "Allow read for all on property_amenities" on public.property_amenities for select using (true);
create policy if not exists "Allow read for all on property_investments" on public.property_investments for select using (true);

-- Admin-only writes: require user to have admin role
-- Helper function to check admin role
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = uid and r.name = 'admin'
  );
$$;

-- Policies for write access
create policy if not exists "Admins can manage hosts" on public.hosts
  for all using (auth.uid() is not null and public.is_admin(auth.uid()))
  with check (auth.uid() is not null and public.is_admin(auth.uid()));

create policy if not exists "Admins can manage properties" on public.properties
  for all using (auth.uid() is not null and public.is_admin(auth.uid()))
  with check (auth.uid() is not null and public.is_admin(auth.uid()));

create policy if not exists "Admins can manage property_prices" on public.property_prices
  for all using (auth.uid() is not null and public.is_admin(auth.uid()))
  with check (auth.uid() is not null and public.is_admin(auth.uid()));

create policy if not exists "Admins can manage amenities" on public.amenities
  for all using (auth.uid() is not null and public.is_admin(auth.uid()))
  with check (auth.uid() is not null and public.is_admin(auth.uid()));

create policy if not exists "Admins can manage property_amenities" on public.property_amenities
  for all using (auth.uid() is not null and public.is_admin(auth.uid()))
  with check (auth.uid() is not null and public.is_admin(auth.uid()));

create policy if not exists "Admins can manage property_investments" on public.property_investments
  for all using (auth.uid() is not null and public.is_admin(auth.uid()))
  with check (auth.uid() is not null and public.is_admin(auth.uid()));

-- Admin control over config and feature flags
create policy if not exists "All can read config" on public.config for select using (true);
create policy if not exists "Admins manage config" on public.config
  for all using (auth.uid() is not null and public.is_admin(auth.uid()))
  with check (auth.uid() is not null and public.is_admin(auth.uid()));

create policy if not exists "All can read feature_flags" on public.feature_flags for select using (true);
create policy if not exists "Admins manage feature_flags" on public.feature_flags
  for all using (auth.uid() is not null and public.is_admin(auth.uid()))
  with check (auth.uid() is not null and public.is_admin(auth.uid()));

-- Seed base roles and permissions
insert into public.roles (id, name, description)
values
  (gen_random_uuid(), 'admin', 'Full administrative access'),
  (gen_random_uuid(), 'editor', 'Can manage content'),
  (gen_random_uuid(), 'viewer', 'Read-only')
on conflict (name) do nothing;

insert into public.permissions (id, key, description)
values
  (gen_random_uuid(), 'manage:all', 'Full administrative actions'),
  (gen_random_uuid(), 'manage:properties', 'Create and update properties'),
  (gen_random_uuid(), 'manage:config', 'Update configuration and feature flags')
on conflict (key) do nothing;

-- Map admin role to full permission
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p where r.name = 'admin'
on conflict do nothing;

