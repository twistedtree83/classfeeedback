/*
  # Add title field to user profiles
  
  1. Changes
    - Add title field to user_profiles table
    - Add check constraint to ensure valid titles
    - Add title to user metadata for auth users
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add title field to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'title'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN title text;
    ALTER TABLE user_profiles ADD CONSTRAINT valid_title CHECK (title IN ('Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.'));
  END IF;
END $$;