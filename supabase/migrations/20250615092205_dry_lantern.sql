/*
  # Add extension request functionality
  
  1. New Tables
    - `extension_requests` - Stores requests from students for extension activities
  
  2. Changes
    - Create extension_requests table if it doesn't exist
    - Enable RLS on the table
    - Add policies if they don't already exist
    - Create indexes for better performance
*/

-- Create extension_requests table
CREATE TABLE IF NOT EXISTS extension_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid REFERENCES lesson_presentations(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  card_index integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE extension_requests ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Check if the SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'extension_requests'
    AND policyname = 'Public can read extension requests'
  ) THEN
    CREATE POLICY "Public can read extension requests"
      ON extension_requests
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Check if the INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'extension_requests'
    AND policyname = 'Public can submit extension requests'
  ) THEN
    CREATE POLICY "Public can submit extension requests"
      ON extension_requests
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  -- Check if the UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'extension_requests'
    AND policyname = 'Public can update extension requests'
  ) THEN
    CREATE POLICY "Public can update extension requests"
      ON extension_requests
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- Add indexes (using IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS idx_extension_requests_presentation ON extension_requests(presentation_id);
CREATE INDEX IF NOT EXISTS idx_extension_requests_student ON extension_requests(presentation_id, student_name);
CREATE INDEX IF NOT EXISTS idx_extension_requests_card ON extension_requests(presentation_id, card_index);
CREATE INDEX IF NOT EXISTS idx_extension_requests_status ON extension_requests(status);
CREATE INDEX IF NOT EXISTS idx_extension_requests_presentation_status ON extension_requests(presentation_id, status);
CREATE INDEX IF NOT EXISTS idx_extension_requests_student_card_status ON extension_requests(presentation_id, student_name, card_index, status);