/*
  # Fix unique constraint for extension requests
  
  1. Changes
    - Safely deduplicates extension requests
    - Adds a unique constraint if it doesn't already exist
  
  2. Safety
    - Checks for constraint existence before adding it
    - Creates a useful index for improved performance
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

-- Now that we've removed duplicates, check if constraint exists before adding it
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

-- Create an additional index for better query performance if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'unique_extension_request'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_extension_requests_student_card_status 
    ON extension_requests(presentation_id, student_name, card_index, status);
  END IF;
END $$;

-- Drop the temporary table
DROP TABLE extension_requests_to_keep;