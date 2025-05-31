/*
  # Fix OpenAI API key entries
  
  1. Changes
    - Remove duplicate API key entries
    - Ensure only one valid API key exists
    - Maintain RLS policies
  
  2. Security
    - Keep service role access restriction
    - Maintain RLS enforcement
*/

-- First, delete any existing API key entries to start fresh
DELETE FROM secrets 
WHERE name LIKE '%openai%api%key%' 
OR name LIKE '%OPENAI%API%KEY%';

-- Insert a single, clean API key entry
INSERT INTO secrets (name, value)
VALUES ('OPENAI_API_KEY', 'your-api-key-here');

-- Ensure RLS is enabled
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Recreate the service role policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'secrets' 
    AND policyname = 'Service role can access secrets'
  ) THEN
    CREATE POLICY "Service role can access secrets"
    ON secrets FOR ALL
    TO public
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;