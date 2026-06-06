-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Orders table
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_note text,
  video_url     text,
  qr_token      uuid unique default gen_random_uuid(),
  qr_code_url   text,
  status        text not null default 'pending'
                  check (status in ('pending', 'video_uploaded', 'qr_generated', 'shipped')),
  created_at    timestamptz not null default now()
);

-- Enable Row Level Security
alter table orders enable row level security;

-- Policy: authenticated users (store admins) can do everything
create policy "Authenticated users have full access"
  on orders
  for all
  to authenticated
  using (true)
  with check (true);

-- Policy: service role bypasses RLS automatically (Supabase default)
-- The public video page uses the service role key so it can read by qr_token without auth.
