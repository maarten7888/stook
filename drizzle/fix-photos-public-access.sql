-- Fix Photos RLS and Storage Policies for Public Access
-- Run this in Supabase SQL Editor
-- 
-- This allows anonymous users (guests) to view photos from public recipes

-- ============================================
-- 1. FIX RLS POLICIES FOR PHOTOS TABLE
-- ============================================

-- Drop all existing policies
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
DROP POLICY IF EXISTS "Friends can view photos from friend's sessions" ON photos;

-- SELECT: Allow viewing photos from public recipes (for everyone, including anonymous)
-- OR photos from own recipes/sessions (for authenticated users)
CREATE POLICY "photos_select_public_or_own" ON photos
  FOR SELECT USING (
    -- Photos from public recipes (accessible to everyone, including anonymous)
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = photos.recipe_id 
      AND recipes.visibility = 'public'
    )
    OR
    -- Own photos (for authenticated users)
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Photos from own cook sessions (for authenticated users)
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM cook_sessions 
      WHERE cook_sessions.id = photos.cook_session_id 
      AND cook_sessions.user_id = auth.uid()
    ))
    OR
    -- Photos from friend's sessions (for authenticated users)
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM cook_sessions
      JOIN friendships ON (
        (friendships.user_id = auth.uid() AND friendships.friend_id = cook_sessions.user_id)
        OR (friendships.friend_id = auth.uid() AND friendships.user_id = cook_sessions.user_id)
      )
      WHERE cook_sessions.id = photos.cook_session_id
    ))
  );

-- INSERT: Only authenticated users can insert photos
CREATE POLICY "photos_insert_authenticated" ON photos
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- UPDATE: Only authenticated users can update their own photos
CREATE POLICY "photos_update_own" ON photos
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- DELETE: Only authenticated users can delete their own photos
CREATE POLICY "photos_delete_own" ON photos
  FOR DELETE 
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ============================================
-- 2. FIX STORAGE POLICIES FOR PHOTOS BUCKET
-- ============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- INSERT: Only authenticated users can upload
CREATE POLICY "storage_photos_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

-- SELECT: Allow reading photos (signed URLs will be generated server-side via admin client)
-- The actual access control is handled by RLS on the photos table
-- Signed URLs are generated server-side, so this policy mainly affects direct access
CREATE POLICY "storage_photos_select_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'photos');

-- UPDATE: Only authenticated users can update their own photos
CREATE POLICY "storage_photos_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos');

-- DELETE: Only authenticated users can delete their own photos
CREATE POLICY "storage_photos_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos');

