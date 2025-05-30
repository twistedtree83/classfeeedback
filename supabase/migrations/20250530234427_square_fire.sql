/*
  # Clean up lesson plans storage
  
  1. Changes
    - Delete all objects in the lesson_plans bucket
    - Remove the bucket itself
    - Clean up storage policies
    - Remove pdf_path column from lesson_plans table
  
  2. Security
    - Removes storage policies that are no longer needed
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