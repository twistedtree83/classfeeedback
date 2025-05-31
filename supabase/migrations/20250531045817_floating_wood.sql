/*
  # Remove storage integration
  
  1. Changes
    - Remove pdf_path column from lesson_plans table
    - Remove storage policies and objects
  
  2. Notes
    - Storage bucket management is handled separately through the Supabase dashboard
*/

-- Remove pdf_path column from lesson_plans table
ALTER TABLE lesson_plans DROP COLUMN IF EXISTS pdf_path;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can read lesson plans" ON storage.objects;