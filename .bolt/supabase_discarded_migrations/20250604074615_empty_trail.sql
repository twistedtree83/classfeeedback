/*
  # Add card_index to feedback and questions tables
  
  1. New Columns
    - `card_index` (integer) on teaching_feedback table
    - `card_index` (integer) on teaching_questions table
  
  2. Indexes
    - Add indexes for performance on the card_index columns
    - Add composite indexes for common query patterns
  
  3. Purpose
    - Track feedback and questions per specific card, not just per presentation
    - Enable per-card analytics and feedback monitoring
*/

-- Add card_index column to teaching_feedback table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teaching_feedback' AND column_name = 'card_index'
  ) THEN
    ALTER TABLE teaching_feedback ADD COLUMN card_index integer;
  END IF;
END $$;

-- Add card_index column to teaching_questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teaching_questions' AND column_name = 'card_index'
  ) THEN
    ALTER TABLE teaching_questions ADD COLUMN card_index integer;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teaching_feedback_card_index ON teaching_feedback(card_index);
CREATE INDEX IF NOT EXISTS idx_teaching_questions_card_index ON teaching_questions(card_index);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_teaching_feedback_student_card
ON teaching_feedback(presentation_id, student_name, card_index);

CREATE INDEX IF NOT EXISTS idx_teaching_questions_presentation_card
ON teaching_questions(presentation_id, card_index);