/*
  # Remove PDF storage and update lesson plans table

  1. Changes
    - Remove pdf_path column from lesson_plans table
    - Drop storage bucket policies
    - Drop storage bucket

  2. Security
    - No changes to RLS policies
*/

-- Remove pdf_path column from lesson_plans table
ALTER TABLE lesson_plans DROP COLUMN pdf_path;

-- Drop storage bucket policies
DROP POLICY IF EXISTS "Users can upload lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can read lesson plans" ON storage.objects;

-- Drop storage bucket
DROP BUCKET IF EXISTS lesson_plans;