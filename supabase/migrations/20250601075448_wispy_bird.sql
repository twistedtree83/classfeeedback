-- Add level column to lesson_plans table
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS level text;

-- Add topic_background column to lesson_plans.processed_content
COMMENT ON COLUMN public.lesson_plans.processed_content IS 'JSON containing processed lesson plan content with title, summary, duration, level, objectives, materials, topic_background, and sections';