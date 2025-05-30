/*
  # Remove PDF storage and related columns
  
  1. Changes
    - Remove pdf_path column from lesson_plans table
    - Remove storage policies for lesson plans
    - Remove storage bucket for lesson plans
*/

-- Remove pdf_path column from lesson_plans table
ALTER TABLE lesson_plans DROP COLUMN IF EXISTS pdf_path;

-- Drop storage bucket policies
DROP POLICY IF EXISTS "Users can upload lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can read lesson plans" ON storage.objects;

-- Drop storage bucket (using correct syntax)
DELETE FROM storage.buckets WHERE id = 'lesson_plans';