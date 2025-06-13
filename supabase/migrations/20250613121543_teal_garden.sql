/*
  # Add lesson_state column to lesson_presentations

  1. New Columns
    - `lesson_state` (boolean) - Explicit flag to indicate if lesson has started
  
  2. Changes
    - Adds a new column to decouple "waiting room vs lesson" state from the current card index
    - Ensures all existing presentations have the correct state based on current_card_index
  
  3. Security
    - No security changes
*/

-- Add the lesson_state column with default false
ALTER TABLE lesson_presentations
  ADD COLUMN lesson_state BOOLEAN NOT NULL DEFAULT false;

-- Update existing presentations to have the correct state
-- If current_card_index >= 0, set lesson_state to true
UPDATE lesson_presentations
SET lesson_state = (current_card_index >= 0)
WHERE 1=1;

-- Add a constraint to ensure consistency between lesson_state and current_card_index
ALTER TABLE lesson_presentations
  ADD CONSTRAINT chk_waiting_room
  CHECK ((lesson_state = false AND current_card_index = -1)
      OR (lesson_state = true AND current_card_index >= 0));