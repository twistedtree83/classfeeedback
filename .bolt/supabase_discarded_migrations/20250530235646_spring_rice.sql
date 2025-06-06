/*
  # Storage Configuration for Lesson Plans

  1. Changes
    - Create lessonplans bucket
    - Enable RLS on storage.objects
    - Add storage policies for authenticated users
    - Add pdf_path column to lesson_plans table

  2. Security
    - Enable RLS for storage.objects
    - Add policies for authenticated users to read and upload files
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create the lessonplans bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'lessonplans',
  'lessonplans',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can read lesson plans' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can read lesson plans"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'lessonplans');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can upload lesson plans' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can upload lesson plans"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'lessonplans');
  END IF;

  -- Add delete policy for cleanup
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can delete lesson plans' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can delete lesson plans"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'lessonplans');
  END IF;
END $$;

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