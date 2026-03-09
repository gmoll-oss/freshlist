-- Recipe favorites table
CREATE TABLE IF NOT EXISTS recipe_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  meal_name text NOT NULL,
  ingredients jsonb DEFAULT '[]',
  steps jsonb DEFAULT '[]',
  prep_time_minutes int DEFAULT 25,
  servings int DEFAULT 2,
  meal_type text DEFAULT 'dinner',
  times_cooked int DEFAULT 1,
  last_cooked date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON recipe_favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON recipe_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own favorites" ON recipe_favorites
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON recipe_favorites
  FOR DELETE USING (auth.uid() = user_id);
