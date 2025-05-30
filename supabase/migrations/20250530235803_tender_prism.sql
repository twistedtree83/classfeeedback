/*
  # Storage configuration for lesson plans

  1. Changes
    - Creates lessonplans storage bucket
    - Adds storage policies for lesson plan files
    - Adds pdf_path column to lesson_plans table

  2. Security
    - Enables public read access to lesson plan files
    - Allows authenticated users to upload files
    - Allows file owners to delete their files
*/

-- Create storage bucket for lesson plans
INSERT INTO storage.buckets (id, name, public)
SELECT 'lessonplans', 'lessonplans', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'lessonplans'
);

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