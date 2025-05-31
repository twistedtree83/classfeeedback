/*
  # Add PDF storage support to lesson plans
  
  1. Changes
    - Add pdf_path column to lesson_plans table
    - Enable RLS on lesson_plans table
    - Add policy for public access
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

-- Create policy for public access
CREATE POLICY "Allow public access to lesson plans"
ON public.lesson_plans FOR ALL
TO public
USING (true)
WITH CHECK (true);