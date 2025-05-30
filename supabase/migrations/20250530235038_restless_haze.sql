/*
  # Storage policies for lesson plans

  1. Changes
    - Create storage policies for the lessonplans bucket
    - Add policies for authenticated users to read and upload files
    - Add pdf_path column to lesson_plans table if not exists

  2. Security
    - Enable RLS for storage objects
    - Only authenticated users can upload and read files
*/

-- Create the lessonplans bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'lessonplans',
  'lessonplans',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read lesson plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload lesson plans" ON storage.objects;

-- Create policy for reading lesson plans
CREATE POLICY "Users can read lesson plans"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'lessonplans'
  AND auth.role() = 'authenticated'
);

-- Create policy for uploading lesson plans
CREATE POLICY "Users can upload lesson plans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
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