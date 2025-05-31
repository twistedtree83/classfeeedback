/*
  # Add OpenAI API key configuration
  
  1. Changes
    - Add OpenAI API key to secrets table
    - Add policy for secure access
  
  2. Security
    - Only service role can access the key
    - Key is stored securely in secrets table
*/

-- Insert or update OpenAI API key
INSERT INTO secrets (name, value)
VALUES ('OPENAI_API_KEY', 'your-api-key-here')
ON CONFLICT (name) 
DO UPDATE SET value = EXCLUDED.value;

-- Ensure RLS is enabled
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access secrets
CREATE POLICY "Service role can access secrets"
ON secrets FOR ALL
TO public
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');