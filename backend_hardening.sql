-- 1. Create a function to handle new user signups
-- This function will run every time a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
-- This ensures that the function runs AFTER every INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill existing users who might be missing profiles
-- This is a safety measure to fix any old accounts
INSERT INTO public.profiles (id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- 4. Verify the setup
SELECT COUNT(*) as profiles_count FROM public.profiles;
