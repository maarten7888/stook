-- Fix Storage Bucket Policies
-- Run this in Supabase SQL Editor

-- Drop existing storage policies on photos bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Allow authenticated users to upload to photos bucket
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

-- Allow users to read their own photos from photos bucket
CREATE POLICY "Users can read own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'photos');

-- Allow users to update their own photos in photos bucket  
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos');

-- Allow users to delete their own photos from photos bucket
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos');

