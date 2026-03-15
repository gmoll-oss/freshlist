-- Pantry items table
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text,
  quantity real default 1,
  unit text,
  purchase_date date default current_date,
  estimated_expiry date,
  status text default 'fresh' check (status in ('fresh', 'expiring', 'expired', 'used', 'thrown')),
  confidence real default 0.8,
  created_at timestamptz default now()
);

alter table public.pantry_items enable row level security;

drop policy if exists "Users can manage their own pantry items" on public.pantry_items;
create policy "Users can manage their own pantry items"
  on public.pantry_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Family groups table (restructured with invite code system)
create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.family_groups enable row level security;

-- Family members table
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.family_groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique(family_id, user_id)
);

alter table public.family_members enable row level security;

-- RLS: family_groups — members can see their group
create policy "Family members can view their group"
  on public.family_groups for select
  using (
    id in (select family_id from public.family_members where user_id = auth.uid())
  );

-- RLS: family_groups — anyone can select by invite_code (for joining)
create policy "Anyone can look up a group by invite code"
  on public.family_groups for select
  using (true);

-- RLS: family_groups — owner can insert
create policy "Users can create family groups"
  on public.family_groups for insert
  with check (auth.uid() = owner_id);

-- RLS: family_groups — owner can update/delete
create policy "Owners can manage their family group"
  on public.family_groups for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete their family group"
  on public.family_groups for delete
  using (auth.uid() = owner_id);

-- RLS: family_members — members of the same family can see each other
create policy "Family members can view fellow members"
  on public.family_members for select
  using (
    family_id in (select family_id from public.family_members where user_id = auth.uid())
  );

-- RLS: family_members — users can insert themselves (joining)
create policy "Users can join a family"
  on public.family_members for insert
  with check (auth.uid() = user_id);

-- RLS: family_members — users can delete themselves (leaving)
create policy "Users can leave a family"
  on public.family_members for delete
  using (auth.uid() = user_id);

-- RLS: owner can remove members
create policy "Owners can remove family members"
  on public.family_members for delete
  using (
    family_id in (select id from public.family_groups where owner_id = auth.uid())
  );

-- Add family_id to shopping_items (nullable for individual mode)
alter table public.shopping_items
  add column if not exists family_id uuid references public.family_groups(id) on delete set null;

-- Update RLS on shopping_items: users see their own items OR items with matching family_id
-- Drop existing policy first if it exists, then recreate
drop policy if exists "Users can manage their own shopping items" on public.shopping_items;

create policy "Users can view own or family shopping items"
  on public.shopping_items for select
  using (
    auth.uid() = user_id
    or family_id in (select family_id from public.family_members where user_id = auth.uid())
  );

create policy "Users can insert shopping items"
  on public.shopping_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own or family shopping items"
  on public.shopping_items for update
  using (
    auth.uid() = user_id
    or family_id in (select family_id from public.family_members where user_id = auth.uid())
  );

create policy "Users can delete own or family shopping items"
  on public.shopping_items for delete
  using (
    auth.uid() = user_id
    or family_id in (select family_id from public.family_members where user_id = auth.uid())
  );

-- Index for fast invite code lookups
create index if not exists idx_family_groups_invite_code on public.family_groups(invite_code);

-- Index for family member lookups
create index if not exists idx_family_members_user_id on public.family_members(user_id);
create index if not exists idx_family_members_family_id on public.family_members(family_id);

-- Index for shopping items family lookup
create index if not exists idx_shopping_items_family_id on public.shopping_items(family_id);
