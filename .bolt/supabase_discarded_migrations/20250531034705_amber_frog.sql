/*
  # Add OpenAI API key secret

  1. Changes
    - Add a placeholder entry for the OpenAI API key in the secrets table
    - This ensures the application can find the key when processing lesson plans
    
  2. Security
    - The actual API key value should be updated through the Supabase dashboard
    - Only service role can access this table (already configured)
*/

-- Insert the OpenAI API key entry if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM secrets WHERE name = 'OPENAI_API_KEY') THEN
    INSERT INTO secrets (name, value)
    VALUES ('OPENAI_API_KEY', 'REPLACE_WITH_ACTUAL_KEY');
  END IF;
END $$;