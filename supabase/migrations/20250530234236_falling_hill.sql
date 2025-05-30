/*
  # Fix lesson plans storage cleanup
  
  1. Changes
    - Remove pdf_path column from lesson_plans table
    - Clean up storage objects and bucket
    - Remove storage policies
  
  2. Order of Operations
    - Delete objects first to avoid foreign key constraints
    - Then remove bucket and policies
    - Finally remove the column
*/

-- First delete all objects in the lesson_plans bucket
DELETE FROM storage.objects WHERE bucket_id = 'lesson_plans';

-- Now we can safely drop the bucket
DELETE FROM storage.buckets WHERE id = 'lesson_plans';

-- Drop storage bucket policies
DROP POLICY IF EXISTS "Users can upload lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can read lesson plans" ON storage.objects;

-- Remove pdf_path column from lesson_plans table
ALTER TABLE lesson_plans DROP COLUMN IF EXISTS pdf_path;