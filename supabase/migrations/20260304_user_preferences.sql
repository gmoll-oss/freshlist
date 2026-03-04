-- ============================================================
-- FreshList: user_preferences
-- ============================================================

create table if not exists user_preferences (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  people_count    int not null default 2,
  meals_config    jsonb not null default '{"lunch": false, "dinner": true}',
  weekly_meals    int not null default 7,
  diet_type       text not null default 'omnivoro',
  intolerances    jsonb not null default '[]',
  budget_weekly   int,
  onboarding_done boolean not null default false,
  updated_at      timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "Users see own preferences"
  on user_preferences for select using (auth.uid() = user_id);
create policy "Users insert own preferences"
  on user_preferences for insert with check (auth.uid() = user_id);
create policy "Users update own preferences"
  on user_preferences for update using (auth.uid() = user_id);
