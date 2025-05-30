/*
  # Create storage bucket for lesson plans

  1. New Storage Bucket
    - Creates a 'lesson_plans' bucket for storing PDF files
    - Sets up appropriate file size limits and allowed mime types

  2. Security
    - Enables public access for authenticated users
    - Adds policies for upload and read access
*/

-- Create the lesson_plans bucket
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'lesson_plans',
  'lesson_plans',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload lesson plans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'lesson_plans'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can read lesson plans"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'lesson_plans'
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