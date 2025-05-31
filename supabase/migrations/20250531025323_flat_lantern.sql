/*
  # Update lesson plans table

  1. Changes
    - Remove PDF storage related columns and functionality
    - Keep focus on storing processed lesson content
*/

-- Remove pdf_path column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_plans'
    AND column_name = 'pdf_path'
  ) THEN
    ALTER TABLE public.lesson_plans DROP COLUMN pdf_path;
  END IF;
END $$;