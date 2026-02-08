-- EMERGENCY: DISABLE ALL TRIGGERS
-- Run this to stop the "Database error" immediately.

-- 1. Drop the trigger that is crashing the database
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function associated with it
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Ensure profiles table permissions are open (so the App can create the profile instead)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (who just signed up) to create their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to read profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);
