/*
  # Add PDF path support to lesson plans

  1. Changes
    - Add pdf_path column to lesson_plans table if not exists
    - Enable RLS on lesson_plans table
    - Create public access policy if not exists
*/

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

-- Enable RLS on lesson_plans table
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lesson_plans' 
    AND policyname = 'Allow public access to lesson plans'
  ) THEN
    CREATE POLICY "Allow public access to lesson plans"
    ON public.lesson_plans FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;