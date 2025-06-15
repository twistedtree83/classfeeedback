/*
  # Fix Extension Request Policies

  1. Purpose:
    - Ensure proper RLS policies for extension_requests table
    - Enable notifications for both authenticated and public users
    - Fix permission issues causing realtime subscription failures

  2. Changes:
    - Drop all existing extension_requests policies
    - Create comprehensive policies for all necessary operations
    - Ensure public access for realtime notifications
*/

-- Make sure RLS is enabled
ALTER TABLE public.extension_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Students can request extension" ON public.extension_requests;
DROP POLICY IF EXISTS "Any authenticated user can read extension requests" ON public.extension_requests;
DROP POLICY IF EXISTS "Allow update of extension request status" ON public.extension_requests;
DROP POLICY IF EXISTS "Public can submit extension requests" ON public.extension_requests;
DROP POLICY IF EXISTS "Public can read extension requests" ON public.extension_requests;
DROP POLICY IF EXISTS "Public can update extension requests" ON public.extension_requests;
DROP POLICY IF EXISTS "Allow public insert to extension_requests" ON public.extension_requests;
DROP POLICY IF EXISTS "Allow public select on extension_requests" ON public.extension_requests;
DROP POLICY IF EXISTS "Allow public update on extension_requests" ON public.extension_requests;

-- Create comprehensive policies

-- 1. Allow authenticated users to read extension requests
CREATE POLICY "Any authenticated user can read extension requests"
  ON public.extension_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Allow public users to read extension requests (crucial for realtime)
CREATE POLICY "Public can read extension requests"
  ON public.extension_requests
  FOR SELECT
  TO public
  USING (true);

-- 3. Allow authenticated users to submit extension requests
CREATE POLICY "Students can request extension"
  ON public.extension_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Allow public users to submit extension requests
CREATE POLICY "Public can submit extension requests"
  ON public.extension_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 5. Allow authenticated users to update extension requests
CREATE POLICY "Allow update of extension request status"
  ON public.extension_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Allow public users to update extension requests
CREATE POLICY "Public can update extension requests"
  ON public.extension_requests
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes to improve performance (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_extension_requests_status') THEN
    CREATE INDEX idx_extension_requests_status ON public.extension_requests(status);
  END IF;
END
$$;

-- Make sure extension_requests table has all necessary columns
DO $$
BEGIN
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_requests'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.extension_requests ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END
$$;