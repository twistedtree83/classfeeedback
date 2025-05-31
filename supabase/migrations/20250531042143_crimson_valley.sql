/*
  # Add real-time teaching functionality

  1. Changes
    - Add real-time enabled flag to lesson_presentations table
    - Add real-time feedback table for student responses during teaching
    - Add real-time questions table for student questions during teaching

  2. Security
    - Enable RLS on new tables
    - Add policies for public access to real-time tables
*/

-- Add real-time enabled flag to lesson_presentations
ALTER TABLE lesson_presentations 
ADD COLUMN realtime_enabled boolean DEFAULT true;

-- Create real-time feedback table
CREATE TABLE IF NOT EXISTS teaching_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid REFERENCES lesson_presentations(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  feedback_type text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now()
);

-- Create real-time questions table
CREATE TABLE IF NOT EXISTS teaching_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid REFERENCES lesson_presentations(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  question text NOT NULL,
  answered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE teaching_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_questions ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow public insert to teaching_feedback"
  ON teaching_feedback
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on teaching_feedback"
  ON teaching_feedback
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public insert to teaching_questions"
  ON teaching_questions
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on teaching_questions"
  ON teaching_questions
  FOR SELECT TO public
  USING (true);

-- Add indexes
CREATE INDEX idx_teaching_feedback_presentation ON teaching_feedback(presentation_id);
CREATE INDEX idx_teaching_questions_presentation ON teaching_questions(presentation_id);