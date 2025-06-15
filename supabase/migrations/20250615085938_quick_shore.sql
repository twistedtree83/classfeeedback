/*
  # Fix extension requests RLS policies
  
  1. Changes
    - Ensures RLS is enabled on extension_requests table
    - Adds policies to allow authenticated users to view extension requests
    - Fixes issue with realtime notifications not reaching teachers
  
  2. Security
    - Maintains insert policy for students
    - Adds select policy for teachers to see extension requests
*/

-- Make sure RLS is enabled
ALTER TABLE public.extension_requests
  ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Students can request extension" ON public.extension_requests;
DROP POLICY IF EXISTS "Allow public insert to extension_requests" ON public.extension_requests; 
DROP POLICY IF EXISTS "Allow public select on extension_requests" ON public.extension_requests;
DROP POLICY IF EXISTS "Any authenticated user can read extension requests" ON public.extension_requests;

-- Create policy for students to insert extension requests
CREATE POLICY "Students can request extension"
  ON public.extension_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for teachers (and any authenticated user) to read extension requests
CREATE POLICY "Any authenticated user can read extension requests"
  ON public.extension_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure update policy exists for changing status (approve/reject)
CREATE POLICY "Allow update of extension request status"
  ON public.extension_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);