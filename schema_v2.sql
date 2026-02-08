-- Run this in your Supabase SQL Editor

-- 1. Create Profiles table for Roles
create table public.profiles (
  id uuid references auth.users not null,
  role text check (role in ('admin', 'user')) default 'user',
  primary key (id)
);

-- 2. Enable RLS on profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);

-- 3. Update Societies table
alter table public.societies add column user_id uuid references auth.users;
alter table public.societies add column is_verified boolean default false;

-- 4. Trigger to create profile on signup (Optional but recommended)
-- For now, we will handle profile creation in the frontend code for simplicity in MVP.
