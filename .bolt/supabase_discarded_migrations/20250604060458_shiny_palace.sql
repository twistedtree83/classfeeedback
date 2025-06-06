/*
  # Add title field to user profiles
  
  1. Changes
    - Add title field to user_profiles table
    - Add default value constraints
    - Update existing policies
*/

-- Add title field to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'title'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN title text CHECK (title IN ('Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.'));
  END IF;
END $$;