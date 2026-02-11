-- RESTORE & FIX TRIGGER (The "Right Way")
-- 1. Drop old artifacts just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the Function with SECURITY DEFINER
-- We insert into PROFILES (because that's what your login checks), not Societies.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- <--- Critical Fix!

-- 3. Attach the Trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. BONUS: Re-Apply Foreign Key Fixes (To fix "Failed to Delete User")
-- This ensures that deleting a user also deletes their profile/logs automatically.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compost_logs' AND column_name = 'user_id') THEN
        ALTER TABLE public.compost_logs DROP CONSTRAINT IF EXISTS compost_logs_user_id_fkey;
        ALTER TABLE public.compost_logs
        ADD CONSTRAINT compost_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;
