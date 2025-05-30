/*
  # Fix storage bucket configuration
  
  1. Changes
    - Create storage bucket named 'lessonplans'
    - Set up storage policies for authenticated users
    - Add pdf_path column to lesson_plans table
  
  2. Security
    - Enable policies for authenticated users only
    - Restrict access to bucket contents
*/

-- Create the lessonplans bucket
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'lessonplans',
  'lessonplans',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
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