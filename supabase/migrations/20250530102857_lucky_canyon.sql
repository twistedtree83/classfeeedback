/*
  # Fix lesson plans storage and table structure
  
  1. Changes
    - Create storage bucket for lesson plans
    - Set up proper storage policies
    - Update lesson_plans table structure
    - Add proper RLS policies
*/

-- Create storage bucket for lesson plans
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson_plans', 'lesson_plans', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload PDFs
CREATE POLICY "Users can upload lesson plans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'lesson_plans'
  AND storage.extension(name) = 'pdf'
);

-- Allow users to read their own lesson plans
CREATE POLICY "Users can read lesson plans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson_plans');

-- Update lesson_plans table
ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS pdf_path text;
ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS processed_content jsonb;