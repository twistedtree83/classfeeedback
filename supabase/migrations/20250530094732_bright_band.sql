/*
  # Add OpenAI secrets

  1. Changes
    - Add secure secrets for OpenAI API key
*/

-- Create a secure secrets table if it doesn't exist
create table if not exists secrets (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  value text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table secrets enable row level security;

-- Only allow the service role to access secrets
create policy "Service role can manage secrets"
  on secrets
  using (auth.jwt() ->> 'role' = 'service_role');

-- Insert OpenAI API key placeholder (to be updated via dashboard)
insert into secrets (name, value)
values ('openai_api_key', 'your-api-key-here')
on conflict (name) do nothing;