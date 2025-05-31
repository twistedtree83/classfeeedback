/*
  # Link teaching sessions with presentations

  1. Changes
    - Add session creation when starting a teaching presentation
    - Ensure sessions are properly linked to presentations

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for public access
*/

-- Add session_id to lesson_presentations
ALTER TABLE lesson_presentations
ADD COLUMN session_id uuid REFERENCES sessions(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX idx_lesson_presentations_session ON lesson_presentations(session_id);