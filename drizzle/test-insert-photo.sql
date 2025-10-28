-- Test if authenticated users can insert photos
-- Run this after logging in as a user in Supabase

-- First, check if you're authenticated
SELECT auth.uid(), auth.role();

-- Try to insert a test photo
INSERT INTO photos (recipe_id, path, type)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,  -- dummy UUID
  'test.jpg',
  'prep'
);

-- If this fails, you'll see the exact error

