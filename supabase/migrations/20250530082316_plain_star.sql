/*
  # Add session participants table
  
  1. New Tables
    - `session_participants`
      - `id` (uuid, primary key)
      - `session_code` (varchar(6), foreign key to sessions.code)
      - `student_name` (text)
      - `joined_at` (timestamptz)
  
  2. Security
    - Enable RLS on `session_participants` table
    - Add policy for public insert access
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code character varying(6) NOT NULL REFERENCES sessions(code),
  student_name text NOT NULL,
  joined_at timestamptz DEFAULT now()
);

ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access to session_participants"
  ON session_participants
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to session_participants"
  ON session_participants
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX idx_session_participants_code ON session_participants(session_code);