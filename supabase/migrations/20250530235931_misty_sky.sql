/*
  # Fix storage permissions for lesson plans

  1. Changes
    - Create lessonplans bucket if it doesn't exist
    - Enable public access to storage bucket
    - Add storage policies for public access without auth requirement
    - Add pdf_path column to lesson_plans table
  
  2. Security
    - Allow public access to storage bucket
    - Add policies for reading and uploading files
*/

-- Create storage bucket for lesson plans
INSERT INTO storage.buckets (id, name, public)
SELECT 'lessonplans', 'lessonplans', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'lessonplans'
);

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload lesson plans" ON storage.objects;

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