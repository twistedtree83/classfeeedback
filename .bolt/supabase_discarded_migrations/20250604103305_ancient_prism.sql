/*
  # Add support for attachments in teaching cards
  
  1. Changes
    - Create storage bucket for lesson attachments
    - Set up storage policies for public access
  
  2. Security
    - Allow public read access to attachments
    - Allow authenticated users to upload attachments
*/

-- Create storage bucket for lesson attachments
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'lesson_attachments',
  'lesson_attachments',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read lesson attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload lesson attachments" ON storage.objects;

-- Create policy for public read access
CREATE POLICY "Public can read lesson attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson_attachments');

-- Create policy for public upload access
CREATE POLICY "Public can upload lesson attachments"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'lesson_attachments');

-- Create policy for public delete access
CREATE POLICY "Public can delete lesson attachments"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'lesson_attachments');