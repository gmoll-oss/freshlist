-- ============================================================
-- FreshList Phase 2: meal_plans, shopping_items, user_stats
-- ============================================================

-- 1. meal_plans
create table if not exists meal_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  week_start  date not null,
  day         text not null,              -- Lunes, Martes, ...
  meal_name   text not null,
  ingredients jsonb not null default '[]', -- [{name, amount}]
  steps       jsonb not null default '[]', -- ["paso 1", ...]
  prep_time_minutes int not null default 25,
  servings    int not null default 2,
  batch_note  text,
  cooked      boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table meal_plans enable row level security;

create policy "Users see own meal plans"
  on meal_plans for select using (auth.uid() = user_id);
create policy "Users insert own meal plans"
  on meal_plans for insert with check (auth.uid() = user_id);
create policy "Users update own meal plans"
  on meal_plans for update using (auth.uid() = user_id);
create policy "Users delete own meal plans"
  on meal_plans for delete using (auth.uid() = user_id);

-- 2. shopping_items
create table if not exists shopping_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  category    text not null default 'Otro',
  quantity    int not null default 1,
  unit        text not null default 'unidad',
  source      text not null default 'manual',  -- manual | voice | ai_suggestion | auto
  purchased   boolean not null default false,
  store       text,
  meal_plan_id uuid references meal_plans(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table shopping_items enable row level security;

create policy "Users see own shopping items"
  on shopping_items for select using (auth.uid() = user_id);
create policy "Users insert own shopping items"
  on shopping_items for insert with check (auth.uid() = user_id);
create policy "Users update own shopping items"
  on shopping_items for update using (auth.uid() = user_id);
create policy "Users delete own shopping items"
  on shopping_items for delete using (auth.uid() = user_id);

-- 3. user_stats (one row per user)
create table if not exists user_stats (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  current_streak       int not null default 0,
  longest_streak       int not null default 0,
  total_saved_euros    numeric(10,2) not null default 0,
  total_products_saved int not null default 0,
  total_products_thrown int not null default 0,
  total_recipes_cooked int not null default 0,
  updated_at           timestamptz not null default now()
);

alter table user_stats enable row level security;

create policy "Users see own stats"
  on user_stats for select using (auth.uid() = user_id);
create policy "Users insert own stats"
  on user_stats for insert with check (auth.uid() = user_id);
create policy "Users update own stats"
  on user_stats for update using (auth.uid() = user_id);
