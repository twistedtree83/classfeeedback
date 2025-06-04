/*
  # Add card_index to feedback tables
  
  1. New Columns
    - `card_index` (integer) - Added to teaching_feedback and teaching_questions
    - Used to track which card/slide the feedback or question was submitted for
  
  2. Changes
    - Add card_index column to teaching_feedback
    - Add card_index column to teaching_questions
    - Add index for efficient querying
  
  3. Purpose
    - Allows tracking which students gave feedback on each slide
    - Enables limiting students to one feedback per slide
    - Provides teachers with per-slide feedback analysis
*/

-- Add card_index to teaching_feedback table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teaching_feedback' AND column_name = 'card_index'
  ) THEN
    ALTER TABLE teaching_feedback ADD COLUMN card_index integer;
  END IF;
END $$;

-- Add card_index to teaching_questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teaching_questions' AND column_name = 'card_index'
  ) THEN
    ALTER TABLE teaching_questions ADD COLUMN card_index integer;
  END IF;
END $$;

-- Create index on teaching_feedback(presentation_id, student_name, card_index)
CREATE INDEX IF NOT EXISTS idx_teaching_feedback_student_card
ON teaching_feedback(presentation_id, student_name, card_index);

-- Create index on teaching_questions(presentation_id, card_index)
CREATE INDEX IF NOT EXISTS idx_teaching_questions_card
ON teaching_questions(presentation_id, card_index);