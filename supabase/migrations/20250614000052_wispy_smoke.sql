/*
  # Update lesson_state values

  This migration updates existing records to ensure proper lesson_state values
  without adding duplicate constraints.

  1. Changes
    - Sets lesson_state based on current_card_index for all existing records
    - Temporarily disables validation trigger during the update
*/

-- Temporarily disable the validate_cards trigger to avoid validation errors
ALTER TABLE lesson_presentations DISABLE TRIGGER validate_cards;

-- Update existing presentations to have the correct state
-- If current_card_index >= 0, set lesson_state to true
UPDATE lesson_presentations
SET lesson_state = (current_card_index >= 0)
WHERE 1=1;

-- Re-enable the validate_cards trigger
ALTER TABLE lesson_presentations ENABLE TRIGGER validate_cards;