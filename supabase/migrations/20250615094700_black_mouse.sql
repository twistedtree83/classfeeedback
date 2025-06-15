/*
  # Add unique constraint for extension requests

  1. Changes
    - Add unique constraint on (presentation_id, student_name, card_index) to allow upsert operations
    - This prevents duplicate extension requests for the same student on the same card in the same presentation

  2. Security
    - No changes to RLS policies needed
    - Existing policies remain in effect
*/

-- Add unique constraint to allow upsert operations
ALTER TABLE extension_requests 
ADD CONSTRAINT unique_extension_request 
UNIQUE (presentation_id, student_name, card_index);