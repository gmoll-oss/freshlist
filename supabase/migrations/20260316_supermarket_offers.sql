-- Supermarket offers table
create table if not exists public.supermarket_offers (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  store_name text not null,
  product_name text not null,
  description text,
  original_price numeric(8,2),
  offer_price numeric(8,2) not null,
  discount_pct integer,
  category text,
  image_url text,
  valid_from date default current_date,
  valid_until date,
  source_url text,
  external_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prevent duplicate offers from same source
create unique index if not exists idx_offers_external
  on public.supermarket_offers(store_id, external_id)
  where external_id is not null;

-- Fast lookups by store and validity
create index if not exists idx_offers_store_valid
  on public.supermarket_offers(store_id, valid_until);

create index if not exists idx_offers_category
  on public.supermarket_offers(category);

-- Store locations table (physical stores with coordinates)
create table if not exists public.store_locations (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  store_name text not null,
  address text,
  city text,
  postal_code text,
  province text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz default now()
);

create index if not exists idx_store_locations_store
  on public.store_locations(store_id);

create index if not exists idx_store_locations_postal
  on public.store_locations(postal_code);

create index if not exists idx_store_locations_coords
  on public.store_locations(latitude, longitude);

-- Sync log to track scraping runs
create table if not exists public.offer_sync_log (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  status text not null check (status in ('success', 'error', 'partial')),
  offers_count integer default 0,
  error_message text,
  duration_ms integer,
  synced_at timestamptz default now()
);

create index if not exists idx_sync_log_store
  on public.offer_sync_log(store_id, synced_at desc);

-- User favorite stores (which stores each user wants to follow)
create table if not exists public.user_favorite_stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  store_id text not null,
  created_at timestamptz default now(),
  unique(user_id, store_id)
);

alter table public.user_favorite_stores enable row level security;

create policy "Users can manage their favorite stores"
  on public.user_favorite_stores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Offers are public read (no auth needed to browse)
alter table public.supermarket_offers enable row level security;

create policy "Offers are publicly readable"
  on public.supermarket_offers for select
  using (true);

-- Store locations are public read
alter table public.store_locations enable row level security;

create policy "Store locations are publicly readable"
  on public.store_locations for select
  using (true);

-- Sync log readable by all (for debugging)
alter table public.offer_sync_log enable row level security;

create policy "Sync log is publicly readable"
  on public.offer_sync_log for select
  using (true);

-- Function to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_offers_updated_at
  before update on public.supermarket_offers
  for each row execute function public.set_updated_at();

-- Function to find nearby stores using Haversine
create or replace function public.nearby_stores(
  user_lat numeric,
  user_lng numeric,
  radius_km numeric default 10
)
returns table (
  store_id text,
  store_name text,
  address text,
  city text,
  distance_km numeric,
  offers_count bigint
) as $$
  select
    sl.store_id,
    sl.store_name,
    sl.address,
    sl.city,
    round(
      (6371 * acos(
        cos(radians(user_lat)) * cos(radians(sl.latitude)) *
        cos(radians(sl.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(sl.latitude))
      ))::numeric, 1
    ) as distance_km,
    (select count(*) from public.supermarket_offers o
     where o.store_id = sl.store_id
     and (o.valid_until is null or o.valid_until >= current_date)
    ) as offers_count
  from public.store_locations sl
  where (6371 * acos(
    cos(radians(user_lat)) * cos(radians(sl.latitude)) *
    cos(radians(sl.longitude) - radians(user_lng)) +
    sin(radians(user_lat)) * sin(radians(sl.latitude))
  )) <= radius_km
  order by distance_km;
$$ language sql stable;
