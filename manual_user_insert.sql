-- 1. Ensure the required extension is enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Insert the user into auth.users (if not already exists)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sanjog42812@gmail.com',
  crypt('12345678', gen_salt('bf')),
  now(), -- Confirm email immediately
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'sanjog42812@gmail.com'
);

-- 3. Insert the profile for the user (using the ID we just inserted or found)
INSERT INTO public.profiles (id, role)
SELECT id, 'user'
FROM auth.users
WHERE email = 'sanjog42812@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT * FROM auth.users WHERE email = 'sanjog42812@gmail.com';
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'sanjog42812@gmail.com');
