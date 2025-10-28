-- Add user_id column to photos table
-- Run this in Supabase SQL Editor

-- Step 1: Add the column as nullable first
ALTER TABLE photos ADD COLUMN user_id uuid REFERENCES profiles(id);

-- Step 2: Update existing photos to have the user_id from their recipe or session
UPDATE photos SET user_id = (
  SELECT recipes.user_id 
  FROM recipes 
  WHERE recipes.id = photos.recipe_id
  LIMIT 1
) WHERE recipe_id IS NOT NULL AND user_id IS NULL;

UPDATE photos SET user_id = (
  SELECT cook_sessions.user_id 
  FROM cook_sessions 
  WHERE cook_sessions.id = photos.cook_session_id
  LIMIT 1
) WHERE cook_session_id IS NOT NULL AND user_id IS NULL;

-- Step 3: Delete photos that still don't have a user_id (orphaned photos)
DELETE FROM photos WHERE user_id IS NULL;

-- Step 4: Now make it NOT NULL
ALTER TABLE photos ALTER COLUMN user_id SET NOT NULL;

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

