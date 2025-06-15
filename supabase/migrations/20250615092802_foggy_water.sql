-- Check if extension_requests table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'extension_requests') THEN
    -- Create extension_requests table
    CREATE TABLE public.extension_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      presentation_id uuid REFERENCES lesson_presentations(id) ON DELETE CASCADE,
      student_name text NOT NULL,
      card_index integer NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.extension_requests ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create policies if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'extension_requests' 
    AND policyname = 'Public can read extension requests'
  ) THEN
    CREATE POLICY "Public can read extension requests"
      ON public.extension_requests
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'extension_requests' 
    AND policyname = 'Public can submit extension requests'
  ) THEN
    CREATE POLICY "Public can submit extension requests"
      ON public.extension_requests
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'extension_requests' 
    AND policyname = 'Public can update extension requests'
  ) THEN
    CREATE POLICY "Public can update extension requests"
      ON public.extension_requests
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- Add indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_extension_requests_presentation') THEN
    CREATE INDEX idx_extension_requests_presentation ON public.extension_requests(presentation_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_extension_requests_student') THEN
    CREATE INDEX idx_extension_requests_student ON public.extension_requests(presentation_id, student_name);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_extension_requests_card') THEN
    CREATE INDEX idx_extension_requests_card ON public.extension_requests(presentation_id, card_index);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_extension_requests_status') THEN
    CREATE INDEX idx_extension_requests_status ON public.extension_requests(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_extension_requests_presentation_status') THEN
    CREATE INDEX idx_extension_requests_presentation_status ON public.extension_requests(presentation_id, status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_extension_requests_student_card_status') THEN
    CREATE INDEX idx_extension_requests_student_card_status ON public.extension_requests(presentation_id, student_name, card_index, status);
  END IF;
END
$$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Extension requests table and policies setup completed successfully';
END
$$;