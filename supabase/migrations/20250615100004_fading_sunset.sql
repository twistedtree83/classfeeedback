/*
  # Fix duplicate extension requests and ensure unique constraint
  
  1. Changes
    - Removes duplicate extension requests
    - Ensures unique constraint exists but avoids name conflicts
    
  2. Purpose
    - Prevents multiple extension requests from same student for same card
    - Improves database integrity
    - Supports ON CONFLICT operations in application code
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

-- Check if we already have a unique constraint with this name before creating it
DO $$
BEGIN
  -- Check if the constraint already exists by this name
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_extension_request' 
    AND conrelid = 'extension_requests'::regclass
  ) THEN
    -- Create the constraint only if it doesn't exist
    ALTER TABLE extension_requests 
      ADD CONSTRAINT unique_extension_request 
      UNIQUE (presentation_id, student_name, card_index);
  ELSE
    -- Log that we skipped creating the constraint since it already exists
    RAISE NOTICE 'The unique_extension_request constraint already exists, skipping creation';
  END IF;
END $$;

-- Drop the temporary table
DROP TABLE extension_requests_to_keep;