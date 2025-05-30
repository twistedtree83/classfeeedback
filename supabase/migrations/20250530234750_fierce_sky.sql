/*
  # Fix storage policies for lesson plans

  1. Changes
    - Ensures lessonplans bucket exists
    - Recreates storage policies with proper checks
    - Adds pdf_path column if missing
  
  2. Security
    - Only authenticated users can upload and read lesson plans
*/

-- Create the lessonplans bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'lessonplans',
  'lessonplans',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can read lesson plans" ON storage.objects;

-- Recreate storage policies
CREATE POLICY "Users can upload lesson plans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'lessonplans'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can read lesson plans"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'lessonplans'
  AND auth.role() = 'authenticated'
);

-- Add pdf_path column to lesson_plans table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_plans'
    AND column_name = 'pdf_path'
  ) THEN
    ALTER TABLE lesson_plans ADD COLUMN pdf_path text;
  END IF;
END $$;