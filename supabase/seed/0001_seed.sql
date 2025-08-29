-- Seed sample amenities, hosts, and properties

-- Amenities
insert into public.amenities (id, name) values
  (gen_random_uuid(), 'Pool'),
  (gen_random_uuid(), 'WiFi'),
  (gen_random_uuid(), 'Air Conditioning'),
  (gen_random_uuid(), 'Kitchen'),
  (gen_random_uuid(), 'Parking'),
  (gen_random_uuid(), 'Gym Access'),
  (gen_random_uuid(), 'Beach Access')
on conflict (name) do nothing;

-- Hosts
insert into public.hosts (id, name, rating) values
  (gen_random_uuid(), 'Ahmed', 4.80),
  (gen_random_uuid(), 'Fatima', 4.90),
  (gen_random_uuid(), 'Omar', 4.70)
on conflict do nothing;

-- Select host ids for deterministic linking (for demo; adjust for real seed tools)
with h as (
  select name, id from public.hosts where name in ('Ahmed','Fatima','Omar')
)
insert into public.properties (id, title, image_url, location, bedrooms, bathrooms, host_id)
select
  gen_random_uuid(),
  'Luxury Villa with Pool',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60',
  'Riyadh, Saudi Arabia',
  3, 2, (select id from h where name = 'Ahmed')
union all
select
  gen_random_uuid(),
  'Modern Downtown Apartment',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=60',
  'Jeddah, Saudi Arabia',
  2, 1, (select id from h where name = 'Fatima')
union all
select
  gen_random_uuid(),
  'Beachfront Resort Villa',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop&q=60',
  'Dammam, Saudi Arabia',
  4, 3, (select id from h where name = 'Omar')
on conflict do nothing;

-- Prices: daily, weekly, monthly for each property
insert into public.property_prices (property_id, duration, price)
select p.id, 'daily'::rental_duration, x.price from public.properties p
join (
  values
    ('Luxury Villa with Pool', 1500.00),
    ('Modern Downtown Apartment', 900.00),
    ('Beachfront Resort Villa', 2500.00)
) as x(title, price) on x.title = p.title
on conflict do nothing;

insert into public.property_prices (property_id, duration, price)
select p.id, 'weekly'::rental_duration, x.price from public.properties p
join (
  values
    ('Luxury Villa with Pool', 9000.00),
    ('Modern Downtown Apartment', 5400.00),
    ('Beachfront Resort Villa', 15000.00)
) as x(title, price) on x.title = p.title
on conflict do nothing;

insert into public.property_prices (property_id, duration, price)
select p.id, 'monthly'::rental_duration, x.price from public.properties p
join (
  values
    ('Luxury Villa with Pool', 32000.00),
    ('Modern Downtown Apartment', 19000.00),
    ('Beachfront Resort Villa', 52000.00)
) as x(title, price) on x.title = p.title
on conflict do nothing;

-- Link amenities per property
with pa as (
  select p.id as property_id, a.id as amenity_id, p.title, a.name
  from public.properties p
  cross join public.amenities a
  where (p.title = 'Luxury Villa with Pool' and a.name in ('Pool','WiFi','Air Conditioning','Kitchen','Parking'))
     or (p.title = 'Modern Downtown Apartment' and a.name in ('WiFi','Air Conditioning','Kitchen','Gym Access'))
     or (p.title = 'Beachfront Resort Villa' and a.name in ('Beach Access','Pool','WiFi','Air Conditioning','Kitchen','Parking'))
)
insert into public.property_amenities (property_id, amenity_id)
select property_id, amenity_id from pa
on conflict do nothing;

-- Investment details
insert into public.property_investments (property_id, available, expected_return, min_investment)
select p.id, true, x.expected_return, x.min_investment from public.properties p
join (
  values
    ('Luxury Villa with Pool', 17.00, 50000.00),
    ('Modern Downtown Apartment', 15.00, 35000.00),
    ('Beachfront Resort Villa', 19.00, 75000.00)
) as x(title, expected_return, min_investment) on x.title = p.title
on conflict do nothing;

