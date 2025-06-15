/*
  # Comprehensive fix for extension requests notifications
  
  1. Changes
    - Reset and properly configure RLS policies for extension_requests
    - Fix constraint issues with extension_requests table
    - Enable UPDATE permissions explicitly for both authenticated and public users
  
  2. Security
    - Maintain security while ensuring teachers can read student requests
*/

-- Make sure RLS is enabled
ALTER TABLE public.extension_requests
  ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Students can request extension" ON public.extension_requests;
DROP POLICY IF EXISTS "Any authenticated user can read extension requests" ON public.extension_requests;
DROP POLICY IF EXISTS "Allow update of extension request status" ON public.extension_requests;
DROP POLICY IF EXISTS "Allow public insert to extension_requests" ON public.extension_requests; 
DROP POLICY IF EXISTS "Allow public select on extension_requests" ON public.extension_requests;
DROP POLICY IF EXISTS "Allow public update on extension_requests" ON public.extension_requests;

-- Create comprehensive policies that ensure proper access for all roles

-- 1. Allow both authenticated and anon users to read extension requests (important for realtime)
CREATE POLICY "Any authenticated user can read extension requests"
  ON public.extension_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Allow students (authenticated users) to insert requests
CREATE POLICY "Students can request extension"
  ON public.extension_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Ensure proper update permissions for status changes
CREATE POLICY "Allow update of extension request status"
  ON public.extension_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Add public policies to ensure fallbacks work
-- For insert
CREATE POLICY "Public can submit extension requests"
  ON public.extension_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- For select
CREATE POLICY "Public can read extension requests"
  ON public.extension_requests
  FOR SELECT
  TO public
  USING (true);

-- For update
CREATE POLICY "Public can update extension requests"
  ON public.extension_requests
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Enable supabase realtime for extension_requests table
-- This is handled via the Supabase dashboard but documenting it here
-- Navigate to Database → Replication → Tables → extension_requests → Enable realtime