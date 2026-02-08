-- 1. DROP the trigger temporarily to see if it's the cause
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Try inserting the user again manually (checking if they exist first)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at
)
SELECT 
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'sanjog42812@gmail.com', crypt('12345678', gen_salt('bf')), 
  now(), '{"provider":"email","providers":["email"]}', '{}', 
  now(), now()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'sanjog42812@gmail.com'
);

-- 3. Manually insert profile (since trigger is gone)
INSERT INTO public.profiles (id, role)
SELECT id, 'user' 
FROM auth.users 
WHERE email = 'sanjog42812@gmail.com'
ON CONFLICT (id) DO NOTHING;
