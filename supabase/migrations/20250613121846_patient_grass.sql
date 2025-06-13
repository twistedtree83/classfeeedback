/*
  # Add lesson_state column to lesson_presentations table

  1. New Columns
    - `lesson_state` (boolean) - Indicates whether the lesson has started
  
  2. Changes
    - Added constraint to ensure consistency between lesson_state and current_card_index
  
  3. Safety
    - Temporarily disables triggers during update to avoid validation errors
*/

-- Add the lesson_state column with default false
ALTER TABLE lesson_presentations
  ADD COLUMN lesson_state BOOLEAN NOT NULL DEFAULT false;

-- Temporarily disable the validate_cards trigger to avoid validation errors
ALTER TABLE lesson_presentations DISABLE TRIGGER validate_cards;

-- Update existing presentations to have the correct state
-- If current_card_index >= 0, set lesson_state to true
UPDATE lesson_presentations
SET lesson_state = (current_card_index >= 0)
WHERE 1=1;

-- Re-enable the trigger
ALTER TABLE lesson_presentations ENABLE TRIGGER validate_cards;

-- Add a constraint to ensure consistency between lesson_state and current_card_index
ALTER TABLE lesson_presentations
  ADD CONSTRAINT chk_waiting_room
  CHECK ((lesson_state = false AND current_card_index = -1)
      OR (lesson_state = true AND current_card_index >= 0));