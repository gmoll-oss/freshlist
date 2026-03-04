-- ============================================================
-- user_preferences v2: breakfast, multi-diet, cooking_time, health_goal
-- ============================================================

-- Add new columns
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS cooking_time text not null default 'normal';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS health_goal text;

-- Update meals_config default to include breakfast
ALTER TABLE user_preferences ALTER COLUMN meals_config SET DEFAULT '{"breakfast": false, "lunch": false, "dinner": true}';

-- Change diet_type from single text to jsonb array for multi-select
ALTER TABLE user_preferences ALTER COLUMN diet_type DROP DEFAULT;
ALTER TABLE user_preferences ALTER COLUMN diet_type TYPE jsonb USING to_jsonb(ARRAY[diet_type]);
ALTER TABLE user_preferences ALTER COLUMN diet_type SET DEFAULT '["omnivoro"]';
