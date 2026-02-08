-- FIX ALL FOREIGN KEYS FOR USER DELETION
-- Run this if you get "Database error" when deleting a user.

-- 1. Fix 'public.profiles'
-- We drop the constraint and re-add it with CASCADE
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. Fix 'public.societies'
-- Check if the constraint exists, drop it, and re-add with CASCADE
-- (Note: Constraint name might vary, so we try standard names or just alter column)
DO $$
BEGIN
  -- Try to drop common constraint names if they exist
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'societies_user_id_fkey') THEN
    ALTER TABLE public.societies DROP CONSTRAINT societies_user_id_fkey;
  END IF;
END $$;

-- Re-add the constraint correctly
ALTER TABLE public.societies
ADD CONSTRAINT societies_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Cleanup Triggers (Just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Verify RLS (Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Enable RLS for societies too (just to be safe)
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public societies are viewable by everyone" ON public.societies;
CREATE POLICY "Public societies are viewable by everyone" ON public.societies FOR SELECT USING (true);
