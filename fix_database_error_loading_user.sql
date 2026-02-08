-- EMERGENCY DATABASE REPAIR
-- Run this to fix "Database error loading user" and "Failed to delete user"

-- 1. Forcefully remove the profiles table and all its links to auth.users
-- This clears the "Constraint" that is blocking you from deleting the user.
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Remove any remaining triggers that might be crashing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Re-Create the Profiles table correctly
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY, -- ON DELETE CASCADE is key here
  role text CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS (Security) safely
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Add "Open" Policies so existing users don't get locked out
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 6. (Optional) Manual Backfill for any survivors
INSERT INTO public.profiles (id, role)
SELECT id, 'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
