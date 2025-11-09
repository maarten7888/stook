-- Recipe favorites RLS policies
-- Voer dit uit in Supabase SQL Editor

-- Enable RLS on recipe_favorites table
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (voor herhaaldelijk uitvoeren)
DROP POLICY IF EXISTS "Users can view own favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON recipe_favorites;

-- Create policies
CREATE POLICY "Users can view own favorites" ON recipe_favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own favorites" ON recipe_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites" ON recipe_favorites
  FOR DELETE USING (user_id = auth.uid());

