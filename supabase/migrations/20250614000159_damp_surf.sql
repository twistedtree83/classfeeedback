/*
  # Prevent Duplicate Student Approvals

  This migration adds a unique constraint to the session_participants table to prevent duplicate entries
  for the same student in the same session. This ensures that:
  
  1. When a student refreshes their browser, they don't need to be re-approved
  2. Teachers don't see duplicate pending approval requests for the same student
  
  ## Changes
  - Add unique constraint on (session_code, student_name) combination
*/

-- Prevent duplicate (session_code, student_name) rows
ALTER TABLE session_participants
  ADD CONSTRAINT session_participants_unique
  UNIQUE (session_code, student_name);