-- Weekly summaries table
create table if not exists weekly_summaries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_start  date not null,
  meals_cooked     int not null default 0,
  meals_planned    int not null default 0,
  products_saved   int not null default 0,
  products_thrown  int not null default 0,
  euros_saved      numeric not null default 0,
  favorite_meal    text,
  ai_feedback      text,
  created_at  timestamptz not null default now(),
  unique(user_id, week_start)
);

alter table weekly_summaries enable row level security;

create policy "Users see own summaries"
  on weekly_summaries for select
  using (auth.uid() = user_id);

create policy "Users insert own summaries"
  on weekly_summaries for insert
  with check (auth.uid() = user_id);

create policy "Users update own summaries"
  on weekly_summaries for update
  using (auth.uid() = user_id);

create policy "Users delete own summaries"
  on weekly_summaries for delete
  using (auth.uid() = user_id);
