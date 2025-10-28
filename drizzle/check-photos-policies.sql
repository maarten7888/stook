-- Check current policies on photos table
-- Run this in Supabase SQL Editor to see what policies are active

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'photos'
ORDER BY policyname;

