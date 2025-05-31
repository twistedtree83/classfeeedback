/*
  # Improve cards storage and validation

  1. Changes
    - Modify cards column to use JSONB for better performance and validation
    - Add check constraint to ensure cards is a valid JSON array
    - Add trigger to validate card structure on insert/update
  
  2. Security
    - Maintain existing RLS policies
*/

-- Convert cards column to JSONB with validation
ALTER TABLE lesson_presentations 
ALTER COLUMN cards TYPE JSONB USING cards::JSONB;

-- Add check constraint to ensure cards is an array
ALTER TABLE lesson_presentations
ADD CONSTRAINT cards_is_array CHECK (jsonb_typeof(cards) = 'array');

-- Create function to validate card structure
CREATE OR REPLACE FUNCTION validate_card_structure()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure each card has required fields
  IF NOT (
    SELECT bool_and(
      jsonb_typeof(card -> 'id') = 'string' AND
      jsonb_typeof(card -> 'type') = 'string' AND
      jsonb_typeof(card -> 'title') = 'string' AND
      jsonb_typeof(card -> 'content') = 'string'
    )
    FROM jsonb_array_elements(NEW.cards) AS card
  ) THEN
    RAISE EXCEPTION 'Invalid card structure';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate cards on insert/update
CREATE TRIGGER validate_cards
  BEFORE INSERT OR UPDATE ON lesson_presentations
  FOR EACH ROW
  EXECUTE FUNCTION validate_card_structure();