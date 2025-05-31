/*
  # Add Teaching Mode Support
  
  1. New Tables
    - `lesson_presentations`
      - `id` (uuid, primary key)
      - `lesson_id` (uuid, references lesson_plans)
      - `session_code` (varchar(6), unique)
      - `current_card_index` (integer)
      - `cards` (jsonb)
      - `active` (boolean)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on lesson_presentations table
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS lesson_presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lesson_plans(id) ON DELETE CASCADE,
  session_code varchar(6) UNIQUE NOT NULL,
  current_card_index integer DEFAULT 0,
  cards jsonb NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lesson_presentations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to lesson_presentations"
  ON lesson_presentations FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_lesson_presentations_code ON lesson_presentations(session_code);
CREATE INDEX idx_lesson_presentations_lesson ON lesson_presentations(lesson_id);