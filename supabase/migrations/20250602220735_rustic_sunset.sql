/*
  # Add participant approval functionality

  1. Changes
     - Add trigger function to handle participant status updates
     - Add trigger on session_participants table
     - Add RLS policy for updating participant status

  2. Security
     - Enable RLS on session_participants table (already enabled)
     - Add policy for updating participant status
*/

-- Create a function to notify about participant status changes
CREATE OR REPLACE FUNCTION notify_participant_status_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'participant_status_change',
    json_build_object(
      'id', NEW.id,
      'session_code', NEW.session_code,
      'student_name', NEW.student_name,
      'status', NEW.status
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to fire the notification function
DROP TRIGGER IF EXISTS participant_status_change_trigger ON session_participants;
CREATE TRIGGER participant_status_change_trigger
AFTER UPDATE OF status ON session_participants
FOR EACH ROW
EXECUTE FUNCTION notify_participant_status_change();

-- Add policy for updating participant status
CREATE POLICY "Allow public update of participant status" 
ON session_participants 
FOR UPDATE 
TO public 
USING (true);