/*
  # Add card_index column to teaching tables
  
  1. Changes
     - Add `card_index` column to `teaching_feedback` table
     - Add `card_index` column to `teaching_questions` table
     
  2. Rationale
     - These columns are needed for tracking which presentation card student feedback and questions relate to
     - Required by the TeachingFeedbackPanel component that filters feedback by card
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

-- Add index on card_index column for better query performance
CREATE INDEX IF NOT EXISTS idx_teaching_feedback_card_index ON teaching_feedback(card_index);
CREATE INDEX IF NOT EXISTS idx_teaching_questions_card_index ON teaching_questions(card_index);