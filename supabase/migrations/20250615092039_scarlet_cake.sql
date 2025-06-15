/*
  # Add extension requests table
  
  1. New Tables
    - `extension_requests` - Stores requests from students for extension activities
      - `id` (uuid, primary key)
      - `presentation_id` (uuid, foreign key to lesson_presentations)
      - `student_name` (text)
      - `card_index` (integer)
      - `status` (text) - pending, approved, rejected
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on extension_requests table
    - Add policies for public access to extension_requests table
  
  3. Indexes
    - Add indexes for improved query performance
*/

-- Create extension_requests table
CREATE TABLE IF NOT EXISTS extension_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid REFERENCES lesson_presentations(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  card_index integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE extension_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read extension requests"
  ON extension_requests
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can submit extension requests"
  ON extension_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update extension requests"
  ON extension_requests
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_extension_requests_presentation ON extension_requests(presentation_id);
CREATE INDEX idx_extension_requests_student ON extension_requests(presentation_id, student_name);
CREATE INDEX idx_extension_requests_card ON extension_requests(presentation_id, card_index);
CREATE INDEX idx_extension_requests_status ON extension_requests(status);
CREATE INDEX idx_extension_requests_presentation_status ON extension_requests(presentation_id, status);
CREATE INDEX idx_extension_requests_student_card_status ON extension_requests(presentation_id, student_name, card_index, status);