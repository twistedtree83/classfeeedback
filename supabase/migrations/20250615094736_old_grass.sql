/*
  # Fix Extension Request Duplicates and Add Unique Constraint
  
  1. Changes
    - Remove duplicate extension requests keeping only the most recent record for each combination
    - Add a unique constraint to prevent future duplicates and enable upsert operations
    
  2. Security
    - No changes to security policies
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

-- Now that we've removed duplicates, add the unique constraint
ALTER TABLE extension_requests 
ADD CONSTRAINT unique_extension_request 
UNIQUE (presentation_id, student_name, card_index);

-- Drop the temporary table
DROP TABLE extension_requests_to_keep;