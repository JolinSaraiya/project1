-- 1. EMERGENCY FIX: Drop the broken trigger and function first
-- This immediately stops the "Database error" when signing up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Validate/Create the profiles table
-- We assume it exists, but let's be safe
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  role text CHECK (role IN ('admin', 'user')) DEFAULT 'user'
);

-- 3. Enable RLS (Row Level Security) if not already on
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (safely, checking if they exist is hard in SQL script without logic, so we drop/create)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Re-create the Trigger Function (SIMPLIFIED and SAFER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (id) DO NOTHING; -- Key fix: Don't fail if it already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Re-attach the Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Verification: Check if your user needs a profile
INSERT INTO public.profiles (id, role)
SELECT id, 'user'
FROM auth.users
WHERE email = 'sanjog42812@gmail.com'
ON CONFLICT (id) DO NOTHING;
