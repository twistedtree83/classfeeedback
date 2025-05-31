/*
  # Fix storage bucket and policies

  1. Changes
    - Create public storage bucket for lesson plans
    - Add public access policies for the bucket
    - Add pdf_path column to lesson_plans table
  
  2. Security
    - Enable public access to storage bucket
    - Add policies for read, write, and delete operations
*/

-- Create storage bucket for lesson plans with public access
INSERT INTO storage.buckets (id, name, public)
VALUES ('lessonplans', 'lessonplans', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to lesson plans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lessonplans');

CREATE POLICY "Allow public write access to lesson plans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'lessonplans');

CREATE POLICY "Allow public delete access to lesson plans"
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