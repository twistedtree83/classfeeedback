/*
  # Add OpenAI API key secret
  
  1. Changes
    - Add OpenAI API key to secrets table
*/

INSERT INTO secrets (name, value)
VALUES ('OPENAI_API_KEY', 'your-api-key-here')
ON CONFLICT (name) DO NOTHING;