/*
  # Fix lesson state and card index consistency
  
  1. Changes
    - Temporarily disables card validation trigger
    - Updates lesson_state based on current_card_index value
    - Adds a constraint to ensure lesson_state and current_card_index remain in sync
    - Re-enables card validation trigger
*/

-- Temporarily disable the validate_cards trigger to avoid validation errors
ALTER TABLE lesson_presentations DISABLE TRIGGER validate_cards;

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

-- Re-enable the validate_cards trigger
ALTER TABLE lesson_presentations ENABLE TRIGGER validate_cards;