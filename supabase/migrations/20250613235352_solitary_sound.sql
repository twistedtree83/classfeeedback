/*
  # Add lesson_state column to lesson_presentations table

  1. New Columns
    - `lesson_state` (boolean) - Indicates whether the lesson has started
  
  2. Changes
    - Added constraint to ensure consistency between lesson_state and current_card_index
  
  3. Safety
    - Checks if column exists before adding
    - Temporarily disables triggers during update to avoid validation errors
*/

-- Add the lesson_state column with default false if it doesn't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lesson_presentations' 
    AND column_name = 'lesson_state'
  ) THEN
    ALTER TABLE lesson_presentations
      ADD COLUMN lesson_state BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Temporarily disable the validate_cards trigger to avoid validation errors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'validate_cards' 
    AND tgrelid = 'lesson_presentations'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE lesson_presentations DISABLE TRIGGER validate_cards';
  END IF;
END $$;

-- Update existing presentations to have the correct state
-- If current_card_index >= 0, set lesson_state to true
UPDATE lesson_presentations
SET lesson_state = (current_card_index >= 0)
WHERE 1=1;

-- Re-enable the trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'validate_cards' 
    AND tgrelid = 'lesson_presentations'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE lesson_presentations ENABLE TRIGGER validate_cards';
  END IF;
END $$;

-- Add a constraint to ensure consistency between lesson_state and current_card_index
-- First check if the constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_waiting_room' 
    AND conrelid = 'lesson_presentations'::regclass
  ) THEN
    ALTER TABLE lesson_presentations
      ADD CONSTRAINT chk_waiting_room
      CHECK ((lesson_state = false AND current_card_index = -1)
          OR (lesson_state = true AND current_card_index >= 0));
  END IF;
END $$;