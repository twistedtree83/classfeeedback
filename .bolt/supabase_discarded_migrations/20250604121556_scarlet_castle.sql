/*
  # Add presentation notification trigger
  
  1. Changes
    - Add trigger to notify clients when a presentation changes
    - Improve card_index tracking for feedback and questions
  
  2. Security
    - No changes to RLS policies
*/

-- Create a function to notify about presentation changes
CREATE OR REPLACE FUNCTION notify_presentation_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the notification payload
  PERFORM pg_notify(
    'presentation_update',
    json_build_object(
      'id', NEW.id,
      'session_code', NEW.session_code,
      'current_card_index', NEW.current_card_index,
      'previous_index', OLD.current_card_index,
      'timestamp', extract(epoch from now())
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send notification when presentation card index is updated
DROP TRIGGER IF EXISTS presentation_update_trigger ON lesson_presentations;
CREATE TRIGGER presentation_update_trigger
AFTER UPDATE OF current_card_index ON lesson_presentations
FOR EACH ROW
EXECUTE FUNCTION notify_presentation_update();

-- Ensure we have proper indexes for card-specific feedback
CREATE INDEX IF NOT EXISTS idx_teaching_feedback_card
ON teaching_feedback(presentation_id, card_index);

CREATE INDEX IF NOT EXISTS idx_teaching_questions_card
ON teaching_questions(presentation_id, card_index);