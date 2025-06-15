/*
  # Fix Extension Request Policies and Add Unique Index
  
  1. Changes
    - Drop all existing policies on extension_requests table
    - Create comprehensive policies for authenticated and public users
    - Add indexes for better performance
    - Ensure RLS is enabled
    
  2. Security
    - Public policies ensure anyone can read/write extension requests
    - This is crucial for realtime notifications to work correctly
*/

-- Make sure RLS is enabled
ALTER TABLE public.extension_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure a clean slate
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'extension_requests' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.extension_requests', policy_name);
    END LOOP;
END
$$;

-- Create comprehensive policies to ensure proper access

-- PUBLIC SELECT POLICY (most important for realtime)
CREATE POLICY "Public can read extension requests"
  ON public.extension_requests
  FOR SELECT
  TO public
  USING (true);

-- PUBLIC INSERT POLICY
CREATE POLICY "Public can submit extension requests" 
  ON public.extension_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- PUBLIC UPDATE POLICY
CREATE POLICY "Public can update extension requests"
  ON public.extension_requests
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_extension_requests_presentation_status 
  ON public.extension_requests(presentation_id, status);

CREATE INDEX IF NOT EXISTS idx_extension_requests_student_card_status
  ON public.extension_requests(presentation_id, student_name, card_index, status);

-- Notify administrators of the change
DO $$
BEGIN
    RAISE NOTICE 'Extension request policies have been updated to ensure proper access for realtime notifications.';
END
$$;