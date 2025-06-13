/*
  # Fix constraint for lesson_state and current_card_index

  1. Changes
     - Add a constraint to ensure consistency between lesson_state and current_card_index
     - Update existing presentations to have the correct state

  Note: The lesson_state column already exists, so we're only adding the constraint
  and updating existing data.
*/

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