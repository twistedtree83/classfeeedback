/*
  # Add card_index column to teaching feedback and questions tables

  1. Changes
    - Add `card_index` column to `teaching_feedback` table
    - Add `card_index` column to `teaching_questions` table
  
  2. Purpose
    - Enable tracking of which card in a presentation each feedback or question is associated with
    - Support filtering feedback and questions by specific cards
*/

-- Add card_index column to teaching_feedback table
ALTER TABLE teaching_feedback 
ADD COLUMN IF NOT EXISTS card_index INTEGER;

-- Add card_index column to teaching_questions table
ALTER TABLE teaching_questions 
ADD COLUMN IF NOT EXISTS card_index INTEGER;