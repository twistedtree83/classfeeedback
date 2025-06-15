/*
  # Add Remedial Assignments

  1. New Tables
    - `remedial_assignments`
      - `id` (uuid, primary key)
      - `presentation_id` (uuid, references lesson_presentations.id)
      - `student_name` (text, not null)
      - `card_id` (uuid, references card.id, nullable - if null applies to all cards)
      - `created_at` (timestamp with time zone, default now())
      
  2. Security
    - Enable RLS on `remedial_assignments` table
    - Add policy for public access to remedial_assignments
*/

-- Create remedial assignments table
CREATE TABLE IF NOT EXISTS remedial_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid REFERENCES lesson_presentations(id) ON DELETE CASCADE NOT NULL,
  student_name text NOT NULL,
  card_id uuid NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create composite index to improve lookup efficiency
CREATE INDEX IF NOT EXISTS idx_remedial_assignments_presentation_student 
ON remedial_assignments(presentation_id, student_name);

-- Create index for looking up card-specific assignments
CREATE INDEX IF NOT EXISTS idx_remedial_assignments_presentation_card
ON remedial_assignments(presentation_id, card_id);

-- Enable RLS
ALTER TABLE remedial_assignments ENABLE ROW LEVEL SECURITY;

-- Add policies for public access
CREATE POLICY "Public can read remedial_assignments"
  ON remedial_assignments
  FOR SELECT
  TO public
  USING (true);
  
CREATE POLICY "Public can insert remedial_assignments"
  ON remedial_assignments
  FOR INSERT
  TO public
  WITH CHECK (true);
  
CREATE POLICY "Public can delete remedial_assignments"
  ON remedial_assignments
  FOR DELETE
  TO public
  USING (true);