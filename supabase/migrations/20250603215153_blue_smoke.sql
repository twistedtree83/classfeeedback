/*
  # Add teacher messages table
  
  1. New Tables
    - `teacher_messages` - Stores messages sent from teachers to students
      - `id` (uuid, primary key)
      - `presentation_id` (uuid, foreign key)
      - `teacher_name` (text)
      - `message_content` (text)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on teacher_messages table
    - Add policies for public SELECT and INSERT access
    
  3. Performance
    - Create index on presentation_id for faster queries
*/

-- Create the teacher_messages table for sending messages to students
CREATE TABLE IF NOT EXISTS public.teacher_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id uuid REFERENCES public.lesson_presentations(id) ON DELETE CASCADE,
    teacher_name text NOT NULL,
    message_content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teacher_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teacher_messages
DO $$
BEGIN
    -- Check if select policy exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teacher_messages' 
        AND policyname = 'Allow public select on teacher_messages'
    ) THEN
        CREATE POLICY "Allow public select on teacher_messages"
        ON public.teacher_messages FOR SELECT
        TO public
        USING (true);
    END IF;
    
    -- Check if insert policy exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'teacher_messages' 
        AND policyname = 'Allow public insert on teacher_messages'
    ) THEN
        CREATE POLICY "Allow public insert on teacher_messages"
        ON public.teacher_messages FOR INSERT
        TO public
        WITH CHECK (true);
    END IF;
END
$$;

-- Create an index on presentation_id for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_messages_presentation
ON public.teacher_messages(presentation_id);