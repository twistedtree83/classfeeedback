/*
# Add Unique Constraint to Session Participants

1. Changes
  - Removes duplicate (session_code, student_name) combinations from session_participants table
  - Keeps the row with 'approved' status when duplicates exist, or the most recently joined participant
  - Adds a unique constraint to prevent future duplicates

This migration ensures each student only has one entry per session, fixing the issue
where students needed to be re-approved after page refreshes.
*/

-- First, create a temporary table to identify rows to keep
CREATE TEMP TABLE participants_to_keep AS
WITH ranked_participants AS (
  SELECT
    id,
    session_code,
    student_name,
    status,
    joined_at,
    -- Prefer 'approved' status, then most recent
    ROW_NUMBER() OVER (
      PARTITION BY session_code, student_name 
      ORDER BY 
        CASE WHEN status = 'approved' THEN 0 ELSE 1 END,
        joined_at DESC
    ) as row_num
  FROM
    session_participants
)
SELECT id FROM ranked_participants WHERE row_num = 1;

-- Delete duplicates (keeping only the rows we selected above)
DELETE FROM session_participants
WHERE id NOT IN (SELECT id FROM participants_to_keep);

-- Now we can safely add the unique constraint
ALTER TABLE session_participants
  ADD CONSTRAINT session_participants_unique
  UNIQUE (session_code, student_name);

-- Clean up the temporary table
DROP TABLE participants_to_keep;