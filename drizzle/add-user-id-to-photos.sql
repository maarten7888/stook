-- Add user_id column to photos table
-- Run this in Supabase SQL Editor

-- Add the user_id column
ALTER TABLE photos ADD COLUMN user_id uuid REFERENCES profiles(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;

-- Update existing photos to have the user_id from their recipe or session
UPDATE photos SET user_id = (
  SELECT recipes.user_id 
  FROM recipes 
  WHERE recipes.id = photos.recipe_id
) WHERE recipe_id IS NOT NULL;

UPDATE photos SET user_id = (
  SELECT cook_sessions.user_id 
  FROM cook_sessions 
  WHERE cook_sessions.id = photos.cook_session_id
) WHERE cook_session_id IS NOT NULL;

-- Now make it non-null without default
ALTER TABLE photos ALTER COLUMN user_id DROP DEFAULT;

-- Update RLS policy to use user_id
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON photos;

CREATE POLICY "Users can insert their own photos" ON photos
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Also update SELECT policy
DROP POLICY IF EXISTS "Users can view photos for accessible recipes/sessions" ON photos;

CREATE POLICY "Users can view their own photos" ON photos
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = photos.recipe_id 
      AND recipes.visibility = 'public'
    )
  );

