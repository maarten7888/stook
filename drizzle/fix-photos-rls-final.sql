-- FINAL FIX: Drop ALL existing policies and recreate from scratch
-- Run this in Supabase SQL Editor

-- First, drop ALL policies (including ones we just created)
DROP POLICY IF EXISTS "Users can view photos for accessible recipes/sessions" ON photos;
DROP POLICY IF EXISTS "Users can insert photos for own recipes/sessions" ON photos;
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON photos;
DROP POLICY IF EXISTS "Users can update photos for own recipes/sessions" ON photos;
DROP POLICY IF EXISTS "Users can delete photos for own recipes/sessions" ON photos;
DROP POLICY IF EXISTS "Users can manage photos for own recipes/sessions" ON photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON photos;
DROP POLICY IF EXISTS "photos_select_policy" ON photos;
DROP POLICY IF EXISTS "photos_insert_policy" ON photos;
DROP POLICY IF EXISTS "photos_update_policy" ON photos;
DROP POLICY IF EXISTS "photos_delete_policy" ON photos;

-- Create clean policies from scratch

-- SELECT: Users can see their own photos or photos from public recipes
CREATE POLICY "photos_select_policy" ON photos
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = photos.recipe_id 
      AND recipes.visibility = 'public'
    )
  );

-- INSERT: Users can only insert photos with their own user_id
CREATE POLICY "photos_insert_policy" ON photos
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own photos
CREATE POLICY "photos_update_policy" ON photos
  FOR UPDATE USING (user_id = auth.uid());

-- DELETE: Users can only delete their own photos
CREATE POLICY "photos_delete_policy" ON photos
  FOR DELETE USING (user_id = auth.uid());

