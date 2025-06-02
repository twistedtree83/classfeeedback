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

-- Create RLS policies for teacher_messages using PL/pgSQL to check if they already exist
DO $$
BEGIN
    -- Check if the SELECT policy exists before creating it
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
    
    -- Check if the INSERT policy exists before creating it
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