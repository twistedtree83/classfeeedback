-- Add JSON extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create trigger function to validate card structure
DO $$ 
BEGIN
  -- Drop and recreate the function to include attachment validation
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
    
    -- Check that attachments is valid JSON array if present
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(NEW.cards) AS card
      WHERE jsonb_typeof(card -> 'attachments') IS NOT NULL 
        AND jsonb_typeof(card -> 'attachments') != 'array'
    ) THEN
      RAISE EXCEPTION 'Attachments must be a valid JSON array';
    END IF;
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
END $$;

-- Create a function to notify clients of presentation updates
CREATE OR REPLACE FUNCTION notify_presentation_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the notification payload
  PERFORM pg_notify(
    'presentation_update',
    json_build_object(
      'id', NEW.id,
      'session_code', NEW.session_code,
      'current_card_index', NEW.current_card_index
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send notification when presentation is updated
DROP TRIGGER IF EXISTS presentation_update_trigger ON lesson_presentations;
CREATE TRIGGER presentation_update_trigger
AFTER UPDATE ON lesson_presentations
FOR EACH ROW
EXECUTE FUNCTION notify_presentation_update();