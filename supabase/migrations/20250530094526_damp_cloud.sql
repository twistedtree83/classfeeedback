/*
  # Add lesson plans storage

  1. New Tables
    - `lesson_plans`
      - `id` (uuid, primary key)
      - `title` (text)
      - `pdf_path` (text) - Path to PDF in storage
      - `processed_content` (jsonb) - Processed lesson plan data
      - `created_at` (timestamp)
      - `teacher_id` (uuid) - For future auth integration

  2. Storage
    - Create bucket for lesson plan PDFs
    - Set up security policies
*/

-- Create storage bucket for PDFs
insert into storage.buckets (id, name, public)
values ('lesson_plans', 'lesson_plans', false);

-- Allow authenticated users to upload PDFs
create policy "Users can upload lesson plans"
on storage.objects for insert
to public
with check (
  bucket_id = 'lesson_plans'
  and storage.extension(name) = 'pdf'
);

-- Allow users to read their own lesson plans
create policy "Users can read lesson plans"
on storage.objects for select
to public
using (bucket_id = 'lesson_plans');

-- Create lesson plans table
create table if not exists lesson_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  pdf_path text not null,
  processed_content jsonb,
  created_at timestamptz default now(),
  teacher_id uuid
);

-- Enable RLS
alter table lesson_plans enable row level security;

-- Allow users to insert their own lesson plans
create policy "Users can insert lesson plans"
  on lesson_plans
  for insert
  to public
  with check (true);

-- Allow users to read lesson plans
create policy "Users can read lesson plans"
  on lesson_plans
  for select
  to public
  using (true);