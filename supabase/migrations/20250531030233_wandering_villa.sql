/*
  # Add storage policies for lesson plans

  1. Storage Policies
    - Allow anonymous users to upload files to lesson-plans bucket
    - Allow anonymous users to read files from lesson-plans bucket
*/

-- Create policy for allowing anonymous users to insert (upload) into the 'lesson-plans' bucket
CREATE POLICY "Allow anon insert to lesson_plans bucket"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'lesson-plans');

-- Create policy for allowing anonymous users to select (read) from the 'lesson-plans' bucket
CREATE POLICY "Allow anon select from lesson_plans bucket"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'lesson-plans');