/*
  # Add PDF storage support for lesson plans
  
  1. Changes
    - Add pdf_path column to lesson_plans table
    - Add index on pdf_path column for faster lookups
  
  2. Notes
    - Storage bucket and policy creation should be done through the Supabase dashboard
    - Column is nullable to support existing records
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

-- Add index on pdf_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_lesson_plans_pdf_path ON public.lesson_plans (pdf_path);