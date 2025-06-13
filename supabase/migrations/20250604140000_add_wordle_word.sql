/*
  # Add Wordle word to lesson presentations and fix teaching feedback tables

  1. Changes
    - Add wordle_word column to lesson_presentations table
    - Add card_index column to teaching_feedback table
    - Add card_index column to teaching_questions table

  2. Security
    - Maintain existing RLS policies
*/

-- Add wordle_word column to lesson_presentations
ALTER TABLE lesson_presentations 
ADD COLUMN IF NOT EXISTS wordle_word text;

-- Add card_index column to teaching_feedback table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teaching_feedback' AND column_name = 'card_index'
  ) THEN
    ALTER TABLE teaching_feedback ADD COLUMN card_index integer;
  END IF;
END $$;

-- Add card_index column to teaching_questions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teaching_questions' AND column_name = 'card_index'
  ) THEN
    ALTER TABLE teaching_questions ADD COLUMN card_index integer;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teaching_feedback_card_index 
  ON teaching_feedback(card_index);

CREATE INDEX IF NOT EXISTS idx_teaching_feedback_student_card 
  ON teaching_feedback(presentation_id, student_name, card_index);

CREATE INDEX IF NOT EXISTS idx_teaching_questions_card_index 
  ON teaching_questions(card_index);

CREATE INDEX IF NOT EXISTS idx_teaching_questions_student_card 
  ON teaching_questions(presentation_id, student_name, card_index); 