-- Add level column to lesson_plans table
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS level text;