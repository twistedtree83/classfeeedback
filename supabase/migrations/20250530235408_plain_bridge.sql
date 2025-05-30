/*
  # Storage setup for lesson plans

  1. Storage Configuration
    - Creates lessonplans bucket if it doesn't exist
    - Ensures bucket is private (not public)
  
  2. Security
    - Checks for existing policies before creating new ones
    - Adds policies for authenticated users to:
      - Read lesson plans
      - Upload lesson plans
  
  3. Database Changes
    - Adds pdf_path column to lesson_plans table if not present
*/

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
    USING (
      bucket_id = 'lessonplans'
      AND auth.role() = 'authenticated'
    );
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
    WITH CHECK (
      bucket_id = 'lessonplans'
      AND auth.role() = 'authenticated'
    );
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