-- This migration safely removes duplicates and adds a unique constraint for extension requests

-- First create a temporary table to identify records to keep (most recent for each unique combo)
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

-- Check if constraint exists before adding it to avoid errors
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_extension_request' 
    AND conrelid = 'extension_requests'::regclass
  ) THEN
    -- Add the constraint only if it doesn't exist
    ALTER TABLE extension_requests 
    ADD CONSTRAINT unique_extension_request 
    UNIQUE (presentation_id, student_name, card_index);
    
    RAISE NOTICE 'Created unique_extension_request constraint';
  ELSE
    RAISE NOTICE 'The unique_extension_request constraint already exists, skipping creation';
  END IF;
END $$;

-- Drop the temporary table
DROP TABLE extension_requests_to_keep;