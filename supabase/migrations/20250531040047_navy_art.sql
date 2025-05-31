/*
  # Add lesson sections table and policies
  
  1. New Tables
    - `lesson_sections`
      - `id` (uuid, primary key)
      - `lesson_id` (uuid, foreign key to lesson_plans)
      - `title` (text)
      - `duration` (text)
      - `content` (text)
      - `activities` (text[])
      - `assessment` (text)
      - `order` (integer)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS lesson_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lesson_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration text NOT NULL,
  content text NOT NULL,
  activities text[] DEFAULT '{}',
  assessment text,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to lesson sections"
  ON lesson_sections FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_lesson_sections_lesson_id ON lesson_sections(lesson_id);
CREATE INDEX idx_lesson_sections_order ON lesson_sections("order");