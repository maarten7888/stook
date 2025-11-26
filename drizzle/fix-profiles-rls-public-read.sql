-- Fix RLS policies for profiles to allow public read access
-- This is needed for displaying author names in recipes, reviews, etc.

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view public profile info" ON profiles;

-- Add policy to allow public read of profile information
CREATE POLICY "Anyone can view public profile info" ON profiles
  FOR SELECT USING (true);

-- Note: This allows anyone to read profile information
-- This is necessary for displaying author names in recipes and reviews
-- Users can still only UPDATE their own profile (existing policy)

