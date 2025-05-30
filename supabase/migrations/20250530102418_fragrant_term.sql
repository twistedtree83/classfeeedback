/*
  # Remove PDF storage and related columns
  
  1. Changes
    - Remove objects from the lesson_plans storage bucket
    - Remove storage bucket policies
    - Remove storage bucket
    - Remove pdf_path column from lesson_plans table
*/

-- First delete all objects in the bucket
DELETE FROM storage.objects WHERE bucket_id = 'lesson_plans';

-- Drop storage bucket policies
DROP POLICY IF EXISTS "Users can upload lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can read lesson plans" ON storage.objects;

-- Now we can safely delete the bucket
DELETE FROM storage.buckets WHERE id = 'lesson_plans';

-- Remove pdf_path column from lesson_plans table
ALTER TABLE lesson_plans DROP COLUMN IF EXISTS pdf_path;