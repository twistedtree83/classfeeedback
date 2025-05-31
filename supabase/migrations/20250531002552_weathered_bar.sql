/*
  # Storage configuration for lesson plans

  1. Changes
    - Creates a public storage bucket for lesson plans
    - Configures storage policies for public access
    - Ensures pdf_path column exists in lesson_plans table

  2. Security
    - Enables public access to the storage bucket
    - Creates policies for read, write, and delete operations
*/

-- Create storage bucket for lesson plans with public access
INSERT INTO storage.buckets (id, name, public)
SELECT 'lessonplans', 'lessonplans', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'lessonplans'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete lesson plans" ON storage.objects;

-- Create policy for public read access
CREATE POLICY "Public can read lesson plans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lessonplans');

-- Create policy for public upload access
CREATE POLICY "Public can upload lesson plans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'lessonplans');

-- Create policy for public delete access
CREATE POLICY "Public can delete lesson plans"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'lessonplans');

-- Add pdf_path column to lesson_plans table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_plans'
    AND column_name = 'pdf_path'
  ) THEN
    ALTER TABLE public.lesson_plans ADD COLUMN pdf_path text;
  END IF;
END $$;