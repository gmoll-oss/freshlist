-- Add meal_type column to meal_plans
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'dinner'
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));
