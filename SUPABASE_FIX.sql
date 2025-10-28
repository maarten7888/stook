-- FINAL FIX FOR PHOTO UPLOAD
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Drop the old policy
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON photos;

-- Create the new policy with auth.uid() check instead of auth.role()
CREATE POLICY "Authenticated users can insert photos" ON photos
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

