-- Complete fix for photos RLS policies
-- Run this in Supabase SQL Editor

-- First, drop ALL existing policies on photos table
DROP POLICY IF EXISTS "Users can view photos for accessible recipes/sessions" ON photos;
DROP POLICY IF EXISTS "Users can insert photos for own recipes/sessions" ON photos;
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON photos;
DROP POLICY IF EXISTS "Users can update photos for own recipes/sessions" ON photos;
DROP POLICY IF EXISTS "Users can delete photos for own recipes/sessions" ON photos;
DROP POLICY IF EXISTS "Users can manage photos for own recipes/sessions" ON photos;

-- Create new policies from scratch

-- 1. SELECT: View photos for accessible recipes/sessions
CREATE POLICY "Users can view photos for accessible recipes/sessions" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = photos.recipe_id 
      AND (recipes.visibility = 'public' OR recipes.user_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM cook_sessions 
      WHERE cook_sessions.id = photos.cook_session_id 
      AND cook_sessions.user_id = auth.uid()
    )
  );

-- 2. INSERT: Allow authenticated users (ownership checked in API)
CREATE POLICY "Authenticated users can insert photos" ON photos
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- 3. UPDATE: Users can update their own photos
CREATE POLICY "Users can update photos for own recipes/sessions" ON photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = photos.recipe_id 
      AND recipes.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM cook_sessions 
      WHERE cook_sessions.id = photos.cook_session_id 
      AND cook_sessions.user_id = auth.uid()
    )
  );

-- 4. DELETE: Users can delete their own photos
CREATE POLICY "Users can delete photos for own recipes/sessions" ON photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = photos.recipe_id 
      AND recipes.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM cook_sessions 
      WHERE cook_sessions.id = photos.cook_session_id 
      AND cook_sessions.user_id = auth.uid()
    )
  );

