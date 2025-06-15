/*
  # Add vocabulary terms table
  
  1. New Tables
    - `vocabulary_terms`
      - `id` (uuid, primary key)
      - `lesson_id` (uuid, foreign key to lesson_plans)
      - `word` (text)
      - `definition` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policy for public read access
    - Add policy for authenticated insert/delete
*/

-- Create vocabulary_terms table
CREATE TABLE IF NOT EXISTS vocabulary_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lesson_plans(id) ON DELETE CASCADE,
  word text NOT NULL,
  definition text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vocabulary_terms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read vocabulary terms"
  ON vocabulary_terms
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert vocabulary terms"
  ON vocabulary_terms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete their own vocabulary terms"
  ON vocabulary_terms
  FOR DELETE
  TO authenticated
  USING (
    lesson_id IN (
      SELECT id FROM lesson_plans WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_vocabulary_terms_lesson_id ON vocabulary_terms(lesson_id);
CREATE INDEX idx_vocabulary_terms_word ON vocabulary_terms(word);