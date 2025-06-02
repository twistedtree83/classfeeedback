/*
  # Add participant status

  1. Changes
    - Add status column to session_participants table
    - Add index on status column for better query performance
    - Update existing rows to have default 'pending' status

  2. Security
    - No changes to RLS
*/

-- Add status column to session_participants table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'session_participants' AND column_name = 'status'
  ) THEN
    ALTER TABLE session_participants ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- Add an index on the status column for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_session_participants_status'
  ) THEN
    CREATE INDEX idx_session_participants_status ON session_participants(status);
  END IF;
END $$;

-- Update existing rows to have the default 'pending' status if they don't have one
UPDATE session_participants 
SET status = 'pending' 
WHERE status IS NULL;