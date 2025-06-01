-- Add user_id to lesson_plans for ownership
ALTER TABLE public.lesson_plans 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for lesson_plans
DROP POLICY IF EXISTS "Users can read lesson plans" ON public.lesson_plans;
DROP POLICY IF EXISTS "Users can insert lesson plans" ON public.lesson_plans;

CREATE POLICY "Users can read their own lesson plans"
ON public.lesson_plans
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own lesson plans"
ON public.lesson_plans
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lesson plans"
ON public.lesson_plans
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own lesson plans"
ON public.lesson_plans
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Keep public access for now to support transitioning
CREATE POLICY "Public can still read lesson plans during transition"
ON public.lesson_plans
FOR SELECT
TO anon
USING (true);

-- Create user_profiles table to store additional user data
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  school TEXT,
  grade_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());