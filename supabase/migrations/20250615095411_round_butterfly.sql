/*
  # Fix unique constraint for extension requests
  
  1. Changes
    - De-duplicates existing extension_requests records
    - Creates unique constraint if it doesn't already exist
  
  2. Notes
    - Safely handles the case where constraint already exists
    - Keeps only the most recent request for each unique combination
*/

-- First create a temporary table to identify the records we want to keep
CREATE TEMP TABLE extension_requests_to_keep AS
WITH ranked_requests AS (
  SELECT
    id,
    presentation_id,
    student_name,
    card_index,
    ROW_NUMBER() OVER (
      PARTITION BY presentation_id, student_name, card_index
      ORDER BY created_at DESC
    ) as row_num
  FROM
    extension_requests
)
SELECT id FROM ranked_requests WHERE row_num = 1;

-- Delete all duplicates (keeping only the most recent entries)
DELETE FROM extension_requests
WHERE id NOT IN (SELECT id FROM extension_requests_to_keep);

-- Now that we've removed duplicates, add the unique constraint if it doesn't already exist
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_extension_request' 
    AND conrelid = 'extension_requests'::regclass
  ) THEN
    -- Create the constraint only if it doesn't exist
    ALTER TABLE extension_requests 
    ADD CONSTRAINT unique_extension_request 
    UNIQUE (presentation_id, student_name, card_index);
  END IF;
END $$;

-- Create index for extension requests if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_extension_requests_student_card_status'
  ) THEN
    CREATE INDEX idx_extension_requests_student_card_status 
    ON extension_requests(presentation_id, student_name, card_index, status);
  END IF;
END $$;

-- Drop the temporary table
DROP TABLE extension_requests_to_keep;